/**
 * 5TOT Đại học Đà Nẵng — Frontend Domain Portal V2 Collective, Evidence & Audit Routes (Backend V2)
 * Cơ quan quản lý: Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Router, Request, Response } from 'express';
import { MAX_EVIDENCE_SIZE_BYTES } from '../../shared/storage/r2StorageClient';
import {
  ALLOWED_EXTENSIONS,
  STAFF_SEED_ACCOUNTS,
  createEmptyCollectiveRequirements,
  portalState,
  appendPortalAuditLog,
  savePortalStateToDisk,
  resolveSessionActor,
  requireAllowedRoles,
  type StoredEvidenceRecord,
} from './domainPortal.state';

export function registerCollectiveAndEvidencePortalRoutes(router: Router): void {
  // =========================================================================
  // 3. COLLECTIVE APPLICATIONS LIFECYCLE
  // =========================================================================
  router.get('/collective/applications', (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      count: portalState.collectiveApplications.length,
      data: portalState.collectiveApplications,
    });
  });

  router.get('/collective/applications/:id', (req: Request, res: Response): void => {
    const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
    if (!app) {
      res.status(404).json({
        success: false,
        errorCode: 'COLLECTIVE_NOT_FOUND',
        error: 'Không tìm thấy hồ sơ tập thể',
      });
      return;
    }
    res.status(200).json({ success: true, data: app });
  });

  router.put('/collective/applications/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const incoming = (req.body?.application || req.body || {}) as Record<string, any>;
    const idx = portalState.collectiveApplications.findIndex((c) => c.id === id);
    const merged: Record<string, any> = {
      ...(idx >= 0 ? portalState.collectiveApplications[idx] : {}),
      ...incoming,
      id,
      updatedAt: incoming.updatedAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      portalState.collectiveApplications[idx] = merged;
    } else {
      portalState.collectiveApplications.unshift(merged);
    }
    savePortalStateToDisk();
    res.status(200).json({ success: true, data: merged });
  });

  router.post('/collective/applications', (req: Request, res: Response): void => {
    const {
      collectiveName,
      collectiveType,
      institutionId,
      institutionName,
      schoolReviewUnitId,
      schoolReviewUnitName,
      facultyName,
      academicYear,
      contactPhone,
      preparedByUserId,
      preparedByUserName,
      preparedByUserEmail,
    } = (req.body || {}) as Record<string, string>;

    if (!collectiveName || !collectiveType || !institutionId) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_REQUIRED_FIELDS',
        error: 'Thiếu thông tin bắt buộc của tập thể',
      });
      return;
    }

    const id = `COL-2026-DN-${Date.now().toString(36).toUpperCase()}`;
    const created: Record<string, any> = {
      id,
      collectiveName,
      collectiveType,
      institutionId,
      institutionName: institutionName || 'Trường Đại học Bách khoa – ĐHĐN',
      schoolReviewUnitId: schoolReviewUnitId || 'unit-dut',
      schoolReviewUnitName: schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN',
      facultyName: facultyName || 'Khoa Đào tạo',
      academicYear: academicYear || '2025–2026',
      contactPhone: contactPhone || '',
      preparedByUserId: preparedByUserId || 'prep-user',
      preparedByUserName: preparedByUserName || 'Người lập hồ sơ',
      preparedByUserEmail: preparedByUserEmail || '',
      status: 'draft',
      requirements: createEmptyCollectiveRequirements(),
      requirementJudgments: {},
      evidenceJudgments: {},
      supplementRequests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    portalState.collectiveApplications.unshift(created);
    appendPortalAuditLog({
      track: 'COLLECTIVE',
      applicationId: id,
      action: 'CREATE_COLLECTIVE_APPLICATION',
      actorId: created.preparedByUserId,
      actorName: created.preparedByUserName,
      actorRole: 'COLLECTIVE_PREPARER',
      details: `Khởi tạo hồ sơ tập thể: ${collectiveName}`,
    });

    res.status(201).json({ success: true, data: created });
  });

  router.put('/collective/applications/:id/basic-info', (req: Request, res: Response): void => {
    const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
    if (!app) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
      return;
    }
    const { collectiveName, collectiveType, institutionId, institutionName, facultyName, contactPhone } =
      (req.body || {}) as Record<string, string>;
    if (collectiveName) app.collectiveName = collectiveName;
    if (collectiveType) app.collectiveType = collectiveType;
    if (institutionId) app.institutionId = institutionId;
    if (institutionName) app.institutionName = institutionName;
    if (facultyName) app.facultyName = facultyName;
    if (contactPhone) app.contactPhone = contactPhone;
    app.updatedAt = new Date().toISOString();
    savePortalStateToDisk();

    res.status(200).json({ success: true, data: app });
  });

  router.put(
    '/collective/applications/:id/declarations/:requirementId',
    (req: Request, res: Response): void => {
      const { id, requirementId } = req.params;
      const app = portalState.collectiveApplications.find((c) => c.id === id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }

      const key = requirementId.toLowerCase() as 'tt01' | 'tt02' | 'tt03' | 'tt04';
      if (!app.requirements[key]) {
        res.status(400).json({ success: false, error: `Mã tiêu chuẩn không hợp lệ: ${requirementId}` });
        return;
      }

      const payloadData = (req.body?.data || req.body || {}) as Record<string, any>;
      app.requirements[key] = {
        ...app.requirements[key],
        ...payloadData,
      };
      app.updatedAt = new Date().toISOString();

      const actor = resolveSessionActor(req);
      appendPortalAuditLog({
        track: 'COLLECTIVE',
        applicationId: id,
        action: `UPDATE_COLLECTIVE_${requirementId.toUpperCase()}`,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Cập nhật kê khai tiêu chuẩn ${requirementId.toUpperCase()}`,
      });

      res.status(200).json({ success: true, data: app });
    }
  );

  router.put(
    '/collective/applications/:id/members/:requirementId',
    (req: Request, res: Response): void => {
      const { id, requirementId } = req.params;
      const app = portalState.collectiveApplications.find((c) => c.id === id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }

      const members = Array.isArray(req.body?.members) ? req.body.members : [];
      const reqUpper = requirementId.toUpperCase();
      if (reqUpper === 'TT02') {
        app.requirements.tt02 = {
          ...app.requirements.tt02,
          structuredMembers: members,
          totalMembers: members.length,
          participatingCount: members.filter((m: Record<string, any>) => m.isParticipatingMovement !== false).length,
        };
      } else if (reqUpper === 'TT03') {
        app.requirements.tt03 = {
          ...app.requirements.tt03,
          structuredRecognizedMembers: members,
          recognizedCount: members.length,
        };
      } else {
        res.status(400).json({ success: false, error: 'Chỉ hỗ trợ TT02 hoặc TT03' });
        return;
      }
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();
      res.status(200).json({ success: true, data: app });
    }
  );

  router.post('/collective/applications/:id/submit', (req: Request, res: Response): void => {
    const { id } = req.params;
    const app = portalState.collectiveApplications.find((c) => c.id === id);
    if (!app) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
      return;
    }

    app.status = 'city_unassigned';
    app.submittedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();

    const actor = resolveSessionActor(req);
    appendPortalAuditLog({
      track: 'COLLECTIVE',
      applicationId: id,
      action: 'SUBMIT_COLLECTIVE_TO_CITY',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: 'Nộp trực tiếp hồ sơ tập thể lên Hội Sinh viên Đại học Đà Nẵng',
    });

    res.status(200).json({
      success: true,
      message: 'Đã nộp hồ sơ tập thể trực tiếp lên Hội Sinh viên Đại học Đà Nẵng.',
      destination: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
      data: app,
    });
  });

  router.post(
    '/collective/applications/:id/assign',
    requireAllowedRoles('CITY_MANAGER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const { officerId, assignmentNote } = (req.body || {}) as {
        officerId?: string;
        assignmentNote?: string;
      };
      const app = portalState.collectiveApplications.find((c) => c.id === id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }

      const isReassignment = Boolean(app.assignedOfficerId);
      const officerAcc =
        STAFF_SEED_ACCOUNTS.find((s) => s.id === officerId) ||
        STAFF_SEED_ACCOUNTS.find((s) => s.role === 'CITY_OFFICER');
      app.status = 'city_assigned';
      app.assignedOfficerId = officerAcc?.id || 'staff-off-nam';
      app.assignedOfficerName =
        officerAcc?.fullName || 'Cán bộ xét duyệt cấp Đại học Đà Nẵng';
      app.assignmentNote = assignmentNote || '';
      app.updatedAt = new Date().toISOString();

      const actor = resolveSessionActor(req);
      appendPortalAuditLog({
        track: 'COLLECTIVE',
        applicationId: id,
        action: isReassignment ? 'REASSIGN_COLLECTIVE_OFFICER' : 'ASSIGN_COLLECTIVE_OFFICER',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Phân công cán bộ ${app.assignedOfficerName} thẩm định hồ sơ tập thể`,
      });

      res.status(200).json({
        success: true,
        message: `Đã phân công hồ sơ cho cán bộ ${app.assignedOfficerName}.`,
        isReassignment,
        data: app,
      });
    }
  );

  router.post(
    '/collective/applications/:id/review/start',
    requireAllowedRoles('CITY_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      app.status = 'city_in_review';
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();
      res.status(200).json({ success: true, data: app });
    }
  );

  router.post(
    '/collective/applications/:id/review/requirement',
    requireAllowedRoles('CITY_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      const { requirementId, judgment, notes } = (req.body || {}) as {
        requirementId?: string;
        judgment?: string;
        notes?: string;
      };
      if (!requirementId || !judgment) {
        res.status(400).json({ success: false, error: 'Thiếu requirementId hoặc judgment' });
        return;
      }
      app.requirementJudgments[requirementId] = {
        judgment,
        notes: notes || '',
        updatedAt: new Date().toISOString(),
      };
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();
      res.status(200).json({ success: true, data: app });
    }
  );

  router.post(
    '/collective/applications/:id/review/evidence',
    requireAllowedRoles('CITY_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      const { requirementId, evidenceId, status, notes } = (req.body || {}) as {
        requirementId?: string;
        evidenceId?: string;
        status?: string;
        notes?: string;
      };
      if (!requirementId || !evidenceId || !status) {
        res.status(400).json({ success: false, error: 'Thiếu thông tin đánh giá minh chứng' });
        return;
      }
      app.evidenceJudgments[evidenceId] = {
        requirementId,
        status,
        notes: notes || '',
        updatedAt: new Date().toISOString(),
      };
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();
      res.status(200).json({ success: true, data: app });
    }
  );

  router.post(
    '/collective/applications/:id/review/supplement-request',
    requireAllowedRoles('CITY_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      const { requirementId, reason, deadline, scopeType } = (req.body || {}) as {
        requirementId?: string;
        reason?: string;
        deadline?: string;
        scopeType?: string;
      };
      if (!requirementId || !reason) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp tiêu chuẩn cần bổ sung và nội dung hướng dẫn.',
        });
        return;
      }
      app.status = 'city_supplement_pending';
      app.supplementRequests.push({
        id: `col-supp-${Date.now()}`,
        requirementId,
        reason,
        deadline,
        scopeType: scopeType || 'REQUIREMENT',
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
      app.updatedAt = new Date().toISOString();

      const actor = resolveSessionActor(req);
      appendPortalAuditLog({
        track: 'COLLECTIVE',
        applicationId: app.id,
        action: 'REQUEST_COLLECTIVE_SUPPLEMENT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Yêu cầu bổ sung tiêu chuẩn ${requirementId}: ${reason}`,
      });

      res.status(200).json({ success: true, data: app });
    }
  );

  router.post('/collective/applications/:id/supplement', (req: Request, res: Response): void => {
    const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
    if (!app) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
      return;
    }
    const { requirementId, files, notes } = (req.body || {}) as {
      requirementId?: string;
      files?: Array<Record<string, any>>;
      notes?: string;
    };
    if (!requirementId) {
      res.status(400).json({ success: false, error: 'Thiếu requirementId' });
      return;
    }

    const key = requirementId.toLowerCase() as 'tt01' | 'tt02' | 'tt03' | 'tt04';
    if (app.requirements[key] && Array.isArray(files)) {
      app.requirements[key].evidenceFiles = [
        ...(app.requirements[key].evidenceFiles || []),
        ...files,
      ];
    }
    app.status = 'city_supplement_returned';
    app.updatedAt = new Date().toISOString();

    const actor = resolveSessionActor(req);
    appendPortalAuditLog({
      track: 'COLLECTIVE',
      applicationId: app.id,
      action: 'SUBMIT_COLLECTIVE_SUPPLEMENT',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Nộp bổ sung cho tiêu chuẩn ${requirementId}: ${notes || ''}`,
    });

    res.status(200).json({ success: true, data: app });
  });

  router.post(
    '/collective/applications/:id/review/complete',
    requireAllowedRoles('CITY_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      const { summaryNote } = (req.body || {}) as { summaryNote?: string };
      app.status = 'city_review_completed';
      app.reviewSummaryNote = summaryNote || '';
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();

      res.status(200).json({
        success: true,
        message: 'Đã hoàn tất thẩm định hồ sơ tập thể và chuyển Hội đồng xét chọn.',
        data: app,
      });
    }
  );

  router.post(
    '/collective/applications/:id/review/reopen',
    requireAllowedRoles('CITY_OFFICER', 'CITY_MANAGER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      app.status = 'city_in_review';
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();
      res.status(200).json({
        success: true,
        message: 'Đã mở lại thẩm định hồ sơ tập thể.',
        data: app,
      });
    }
  );

  router.post(
    '/collective/applications/:id/committee/decision',
    requireAllowedRoles('CITY_COMMITTEE'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      const { outcome, notes } = (req.body || {}) as { outcome?: string; notes?: string };
      if (outcome !== 'recognized' && outcome !== 'not_recognized') {
        res.status(400).json({
          success: false,
          error: 'Kết luận Hội đồng phải là recognized hoặc not_recognized.',
        });
        return;
      }

      const actor = resolveSessionActor(req);
      app.status = 'finalized';
      app.committeeDecision = {
        outcome,
        notes: notes || '',
        decidedAt: new Date().toISOString(),
        decidedBy: actor.name,
      };
      app.updatedAt = new Date().toISOString();

      appendPortalAuditLog({
        track: 'COLLECTIVE',
        applicationId: app.id,
        action: 'COMMITTEE_COLLECTIVE_DECISION',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: 'CITY_COMMITTEE',
        details: `Hội đồng kết luận hồ sơ tập thể: ${outcome}`,
      });

      res.status(200).json({
        success: true,
        message: 'Đã ghi nhận quyết định Hội đồng cho hồ sơ tập thể.',
        data: app,
      });
    }
  );

  router.post(
    '/collective/applications/:id/committee/publish',
    requireAllowedRoles('CITY_COMMITTEE'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      const { decisionNumber, decisionDate } = (req.body || {}) as {
        decisionNumber?: string;
        decisionDate?: string;
      };

      const actor = resolveSessionActor(req);
      app.status = 'published';
      app.finalResult = {
        outcome: app.committeeDecision?.outcome || 'recognized',
        decisionNumber: decisionNumber || '112/QĐ-HSV-ĐHĐN',
        decisionDate: decisionDate || new Date().toLocaleDateString('vi-VN'),
        publishedAt: new Date().toISOString(),
        publishedBy: actor.name,
      };
      app.updatedAt = new Date().toISOString();

      appendPortalAuditLog({
        track: 'COLLECTIVE',
        applicationId: app.id,
        action: 'PUBLISH_COLLECTIVE_RESULT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: 'CITY_COMMITTEE',
        details: `Công bố kết quả Tập thể Sinh viên 5 Tốt (${app.finalResult.decisionNumber})`,
      });

      res.status(200).json({
        success: true,
        message: 'Đã công bố kết quả chính thức cho tập thể.',
        data: app,
      });
    }
  );

  router.post(
    '/collective/applications/:id/committee/reopen',
    requireAllowedRoles('CITY_COMMITTEE'),
    (req: Request, res: Response): void => {
      const app = portalState.collectiveApplications.find((c) => c.id === req.params.id);
      if (!app) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tập thể' });
        return;
      }
      app.status = 'city_review_completed';
      app.updatedAt = new Date().toISOString();
      savePortalStateToDisk();
      res.status(200).json({
        success: true,
        message: 'Đã mở lại kết luận Hội đồng cho hồ sơ tập thể.',
        data: app,
      });
    }
  );

  // =========================================================================
  // 4. EVIDENCE UPLOAD / RETRIEVAL & AUDIT LOGS
  // =========================================================================
  router.post('/evidence/upload', (req: Request, res: Response): void => {
    const {
      id: clientEvidenceId,
      ownerTrack,
      applicationId,
      requirementOrCriterionId,
      fileName,
      fileType,
      fileSizeBytes,
      base64Content,
      fileUrl,
    } = (req.body || {}) as {
      id?: string;
      ownerTrack?: 'INDIVIDUAL' | 'COLLECTIVE';
      applicationId?: string;
      requirementOrCriterionId?: string;
      fileName?: string;
      fileType?: string;
      fileSizeBytes?: number;
      base64Content?: string;
      fileUrl?: string;
    };

    if (!ownerTrack || !applicationId || !requirementOrCriterionId || !fileName) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_EVIDENCE_METADATA',
        error: 'Thiếu thông tin hồ sơ, tiêu chí hoặc tên tệp minh chứng.',
      });
      return;
    }

    const ext = (fileName.split('.').pop() || fileType || 'pdf')
      .toLowerCase()
      .replace(/^\./, '');

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      res.status(400).json({
        success: false,
        errorCode: 'UNSUPPORTED_FILE_TYPE',
        error: `Định dạng tệp .${ext} không được hỗ trợ.`,
      });
      return;
    }

    const numericSize = Number(fileSizeBytes) || 1024;
    if (numericSize > MAX_EVIDENCE_SIZE_BYTES) {
      res.status(413).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        errorCode: 'FILE_TOO_LARGE',
        error: 'Dung lượng tệp vượt quá giới hạn tối đa 100 MB.',
      });
      return;
    }

    const sizeKb = Math.max(1, Math.round(numericSize / 1024));
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const evidenceId =
      clientEvidenceId && typeof clientEvidenceId === 'string' && clientEvidenceId.trim()
        ? clientEvidenceId.trim()
        : `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const publicTestPath = path.resolve(process.cwd(), 'public/minhchung_test', path.basename(fileName));
    const resolvedViewUrl =
      fileUrl ||
      (fs.existsSync(publicTestPath)
        ? `/minhchung_test/${encodeURIComponent(path.basename(fileName))}`
        : `/api/v2/portal/evidence/${encodeURIComponent(evidenceId)}`);

    const stored: StoredEvidenceRecord = {
      id: evidenceId,
      ownerTrack: ownerTrack === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'COLLECTIVE',
      applicationId,
      requirementOrCriterionId,
      name: fileName,
      fileType: ext,
      size: sizeLabel,
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      status: 'achieved',
      url: resolvedViewUrl,
      base64Content,
    };

    portalState.evidenceIndex.set(evidenceId, stored);

    if (stored.ownerTrack === 'COLLECTIVE') {
      const colApp = portalState.collectiveApplications.find((c) => c.id === applicationId);
      const reqKey = requirementOrCriterionId.toLowerCase() as 'tt01' | 'tt02' | 'tt03' | 'tt04';
      if (colApp && colApp.requirements[reqKey]) {
        colApp.requirements[reqKey].evidenceFiles = [
          ...(colApp.requirements[reqKey].evidenceFiles || []),
          {
            id: stored.id,
            name: stored.name,
            fileType: stored.fileType,
            size: stored.size,
            uploadedAt: stored.uploadedAt,
            status: stored.status,
            url: stored.url,
          },
        ];
      }
    }

    const actor = resolveSessionActor(req);
    appendPortalAuditLog({
      track: stored.ownerTrack,
      applicationId,
      action: 'UPLOAD_EVIDENCE_FILE',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Tải lên minh chứng "${stored.name}" (${stored.size}) cho ${requirementOrCriterionId}`,
    });
    savePortalStateToDisk();

    res.status(201).json({ success: true, data: stored });
  });

  router.get('/evidence/:id', (req: Request, res: Response): void => {
    const targetId = req.params.id;
    let record = portalState.evidenceIndex.get(targetId);
    if (!record) {
      for (const item of portalState.evidenceIndex.values()) {
        if (item.name === targetId) {
          record = item;
          break;
        }
      }
    }
    if (!record) {
      res.status(404).json({
        success: false,
        errorCode: 'EVIDENCE_NOT_FOUND',
        error: `Không tìm thấy tệp minh chứng ${targetId}`,
      });
      return;
    }
    res.status(200).json({ success: true, data: record });
  });

  router.delete('/evidence/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const ownerTrack = (req.query.ownerTrack as string) || 'COLLECTIVE';
    const applicationId = req.query.applicationId as string | undefined;
    portalState.evidenceIndex.delete(id);
    savePortalStateToDisk();

    const actor = resolveSessionActor(req);
    appendPortalAuditLog({
      track: ownerTrack === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'COLLECTIVE',
      applicationId,
      action: 'DELETE_EVIDENCE_FILE',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Xóa tệp minh chứng ${id}`,
    });

    res.status(200).json({ success: true });
  });

  router.get('/audit-logs', (req: Request, res: Response): void => {
    const applicationId = req.query.applicationId as string | undefined;
    const track = req.query.track as string | undefined;

    const filtered = portalState.auditLogs.filter((entry) => {
      if (applicationId && entry.applicationId !== applicationId) return false;
      if (track && entry.track !== track) return false;
      return true;
    });

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  });
}
