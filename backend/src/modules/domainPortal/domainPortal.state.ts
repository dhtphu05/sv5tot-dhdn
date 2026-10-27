/**
 * 5TOT Đại học Đà Nẵng — Frontend Domain Portal V2 State & Auth Helpers (Backend V2)
 * Cơ quan quản lý: Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { SessionService } from '../sessions/session.service';
import type { SystemRoleCode } from '../identity/identity.types';
import { defaultPasswordHasher } from '../auth/passwordHasher';
import {
  schedulePortalStateNeonDbSync,
  ensurePortalStateHydratedFromNeonDb,
  clearPortalPersistentRecordsInNeonDb,
} from './domainPortal.dbSync';

export interface PortalAuditLogRecord {
  id: string;
  timestamp: string;
  track: 'INDIVIDUAL' | 'COLLECTIVE' | 'SYSTEM';
  applicationId?: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  details: string;
}

export interface PortalAuthSessionPayload {
  authenticated: boolean;
  mode: 'BACKEND';
  token: string;
  accountType: 'STUDENT' | 'COLLECTIVE_PREPARER' | 'STAFF';
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    roleLabel: string;
    unitId?: string;
    unitLabel?: string;
    institutionId?: string;
    institutionName?: string;
    studentCode?: string;
  };
}

export interface StoredEvidenceRecord {
  id: string;
  ownerTrack: 'INDIVIDUAL' | 'COLLECTIVE';
  applicationId: string;
  requirementOrCriterionId: string;
  name: string;
  fileType: string;
  size: string;
  uploadedAt: string;
  status: string;
  url: string;
  base64Content?: string;
}

export const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'doc',
  'docx',
  'xls',
  'xlsx',
]);

export const SCHOOL_UNIT_MAP: Record<string, { unitId: string; unitName: string; instName: string }> = {
  'inst-dut': {
    unitId: 'unit-dut',
    unitName: 'Trường Đại học Bách khoa – ĐHĐN',
    instName: 'Trường Đại học Bách khoa – ĐHĐN',
  },
  'inst-due': {
    unitId: 'unit-due',
    unitName: 'Trường Đại học Kinh tế – ĐHĐN',
    instName: 'Trường Đại học Kinh tế – ĐHĐN',
  },
  'inst-ued': {
    unitId: 'unit-ued',
    unitName: 'Trường Đại học Sư phạm – ĐHĐN',
    instName: 'Trường Đại học Sư phạm – ĐHĐN',
  },
  'inst-ufl': {
    unitId: 'unit-ufl',
    unitName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    instName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
  },
  'inst-ufls': {
    unitId: 'unit-ufl',
    unitName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    instName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
  },
  'inst-ute': {
    unitId: 'unit-ute',
    unitName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    instName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
  },
  'inst-vku': {
    unitId: 'unit-vku',
    unitName: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn – ĐHĐN',
    instName: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn – ĐHĐN',
  },
  'inst-smp': {
    unitId: 'unit-smp',
    unitName: 'Trường Y Dược – ĐHĐN',
    instName: 'Trường Y Dược – ĐHĐN',
  },
  'inst-vnuk': {
    unitId: 'unit-vnuk',
    unitName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    instName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
  },
  'inst-kontum': {
    unitId: 'unit-kontum',
    unitName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    instName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
  },
};

export const STAFF_SEED_ACCOUNTS: Array<{
  id: string;
  email: string;
  aliases?: string[];
  fullName: string;
  role: SystemRoleCode;
  roleLabel: string;
  unitId?: string;
  unitLabel: string;
  institutionId?: string;
}> = [
  // Cán bộ sơ tuyển 9 trường/đơn vị thành viên ĐHĐN (SCHOOL_OFFICER) — mỗi đơn vị thành viên 01 tài khoản độc lập
  {
    id: 'staff-sch-dut',
    email: 'canbo.dut@udn.vn',
    aliases: ['canbo.udn@udn.vn', 'an.nv@udn.vn', 'tien.nv@udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Đại học Bách khoa – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-dut',
    unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
    institutionId: 'inst-dut',
  },
  {
    id: 'staff-sch-due',
    email: 'canbo.due@udn.vn',
    aliases: ['canbo.due@due.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Đại học Kinh tế – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-due',
    unitLabel: 'Trường Đại học Kinh tế – ĐHĐN',
    institutionId: 'inst-due',
  },
  {
    id: 'staff-sch-ued',
    email: 'canbo.ued@udn.vn',
    aliases: ['canbo.ued@ued.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Đại học Sư phạm – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-ued',
    unitLabel: 'Trường Đại học Sư phạm – ĐHĐN',
    institutionId: 'inst-ued',
  },
  {
    id: 'staff-sch-ufl',
    email: 'canbo.ufl@udn.vn',
    aliases: ['canbo.ufl@ufl.udn.vn', 'canbo.ufls@udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Đại học Ngoại ngữ – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-ufl',
    unitLabel: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    institutionId: 'inst-ufl',
  },
  {
    id: 'staff-sch-ute',
    email: 'canbo.ute@udn.vn',
    aliases: ['canbo.ute@ute.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-ute',
    unitLabel: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    institutionId: 'inst-ute',
  },
  {
    id: 'staff-sch-vku',
    email: 'canbo.vku@udn.vn',
    aliases: ['canbo.vku@vku.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-vku',
    unitLabel: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
    institutionId: 'inst-vku',
  },
  {
    id: 'staff-sch-smp',
    email: 'canbo.smp@udn.vn',
    aliases: ['canbo.smp@smp.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Trường Y Dược – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Trường',
    unitId: 'unit-smp',
    unitLabel: 'Trường Y Dược – ĐHĐN',
    institutionId: 'inst-smp',
  },
  {
    id: 'staff-sch-vnuk',
    email: 'canbo.vnuk@udn.vn',
    aliases: ['canbo.vnuk@vnuk.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Viện',
    unitId: 'unit-vnuk',
    unitLabel: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    institutionId: 'inst-vnuk',
  },
  {
    id: 'staff-sch-kontum',
    email: 'canbo.kontum@udn.vn',
    aliases: ['canbo.kontum@kontum.udn.vn'],
    fullName: 'Cán bộ sơ tuyển Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    role: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ sơ tuyển cấp Phân hiệu',
    unitId: 'unit-kontum',
    unitLabel: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    institutionId: 'inst-kontum',
  },
  // Cán bộ xét duyệt cấp Đại học Đà Nẵng (CITY_OFFICER) — 01 tài khoản chính thức
  {
    id: 'staff-off-nam',
    email: 'canbo.dhdn@udn.vn',
    aliases: [
      'canbo.thanhpho@hsvdanang.vn',
      'nam.th@hsvdanang.vn',
      'chau.vtm@hsvdanang.vn',
      'huy.dq@hsvdanang.vn',
      'tung.pt@hsvdanang.vn',
      'linh.pt@hsvdanang.vn',
      'linh.ptm@hsvdanang.vn',
    ],
    fullName: 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
    role: 'CITY_OFFICER',
    roleLabel: 'Cán bộ xét duyệt cấp ĐHĐN',
    unitLabel: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  },
  // Quản lý xét duyệt cấp Đại học Đà Nẵng (CITY_MANAGER) — 01 tài khoản chính thức
  {
    id: 'staff-mgr-ha',
    email: 'quanly.dhdn@udn.vn',
    aliases: ['quanly.thanhpho@hsvdanang.vn', 'ha.nt@hsvdanang.vn'],
    fullName: 'Quản lý xét duyệt cấp Đại học Đà Nẵng',
    role: 'CITY_MANAGER',
    roleLabel: 'Quản lý xét duyệt cấp ĐHĐN',
    unitLabel: 'Ban Thư ký · Hội Sinh viên Đại học Đà Nẵng',
  },
  // Hội đồng xét chọn cấp Đại học Đà Nẵng (CITY_COMMITTEE) — 01 tài khoản chính thức
  {
    id: 'staff-com-quan',
    email: 'hoidong.dhdn@udn.vn',
    aliases: [
      'hoidong.thanhpho@hsvdanang.vn',
      'quan.lm@hsvdanang.vn',
      'thao.tp@hsvdanang.vn',
      'viet.hq@hsvdanang.vn',
    ],
    fullName: 'Hội đồng xét chọn cấp Đại học Đà Nẵng',
    role: 'CITY_COMMITTEE',
    roleLabel: 'Hội đồng xét chọn cấp ĐHĐN',
    unitLabel: 'Hội đồng xét chọn cấp Đại học Đà Nẵng',
  },
  // Quản trị hệ thống 5TOT Đại học Đà Nẵng (ADMIN) — 01 tài khoản chính thức
  {
    id: 'staff-adm-lan',
    email: 'admin@udn.vn',
    aliases: ['admin@hsvdanang.vn', 'lan.pn@hsvdanang.vn', 'khoa.nd@hsvdanang.vn'],
    fullName: 'Quản trị hệ thống 5TOT Đại học Đà Nẵng',
    role: 'ADMIN',
    roleLabel: 'Quản trị hệ thống',
    unitLabel: 'Văn phòng Hội Sinh viên Đại học Đà Nẵng',
  },
];

export const COLLECTIVE_PREPARERS: Array<{
  id: string;
  email: string;
  fullName: string;
  collectiveName: string;
  institutionId: string;
  institutionName: string;
  schoolReviewUnitId: string;
  schoolReviewUnitName: string;
}> = [
  {
    id: 'prep-col-dut-01',
    email: 'mai.nt@dut.udn.vn',
    fullName: 'Nguyễn Thị Mai',
    collectiveName: 'Chi hội Sinh viên 21TCLC_DT1',
    institutionId: 'inst-dut',
    institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
    schoolReviewUnitId: 'unit-dut',
    schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
  },
  {
    id: 'prep-col-due-01',
    email: 'hung.lv@due.udn.vn',
    fullName: 'Lê Văn Hùng',
    collectiveName: 'Liên chi hội Khoa Quản trị Kinh doanh',
    institutionId: 'inst-due',
    institutionName: 'Trường Đại học Kinh tế – ĐHĐN',
    schoolReviewUnitId: 'unit-due',
    schoolReviewUnitName: 'Trường Đại học Kinh tế – ĐHĐN',
  },
  {
    id: 'prep-col-ued-01',
    email: 'thao.np@ued.udn.vn',
    fullName: 'Nguyễn Phương Thảo',
    collectiveName: 'Chi hội Sư phạm Toán 22ST',
    institutionId: 'inst-ued',
    institutionName: 'Trường Đại học Sư phạm – ĐHĐN',
    schoolReviewUnitId: 'unit-ued',
    schoolReviewUnitName: 'Trường Đại học Sư phạm – ĐHĐN',
  },
  {
    id: 'prep-col-ufl-01',
    email: 'linh.nk@ufl.udn.vn',
    fullName: 'Nguyễn Khánh Linh',
    collectiveName: 'Liên chi hội Khoa Tiếng Anh',
    institutionId: 'inst-ufl',
    institutionName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    schoolReviewUnitId: 'unit-ufl',
    schoolReviewUnitName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
  },
  {
    id: 'prep-col-ute-01',
    email: 'nam.ph@ute.udn.vn',
    fullName: 'Phạm Hoài Nam',
    collectiveName: 'Chi đoàn 21KMT',
    institutionId: 'inst-ute',
    institutionName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    schoolReviewUnitId: 'unit-ute',
    schoolReviewUnitName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
  },
  {
    id: 'prep-col-vku-01',
    email: 'khang.dn@vku.udn.vn',
    fullName: 'Đinh Nguyên Khang',
    collectiveName: 'Liên chi hội Khoa Khoa học Máy tính',
    institutionId: 'inst-vku',
    institutionName: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
    schoolReviewUnitId: 'unit-vku',
    schoolReviewUnitName: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
  },
  {
    id: 'prep-col-smp-01',
    email: 'vy.lt@smp.udn.vn',
    fullName: 'Lê Thảo Vy',
    collectiveName: 'Liên chi hội Y khoa',
    institutionId: 'inst-smp',
    institutionName: 'Trường Y Dược – ĐHĐN',
    schoolReviewUnitId: 'unit-smp',
    schoolReviewUnitName: 'Trường Y Dược – ĐHĐN',
  },
  {
    id: 'prep-col-vnuk-01',
    email: 'khoa.nm@vnuk.udn.vn',
    fullName: 'Nguyễn Minh Khoa',
    collectiveName: 'Liên chi hội Viện Nghiên cứu và Đào tạo Việt – Anh',
    institutionId: 'inst-vnuk',
    institutionName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    schoolReviewUnitId: 'unit-vnuk',
    schoolReviewUnitName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
  },
  {
    id: 'prep-col-kontum-01',
    email: 'tuan.nv@kontum.udn.vn',
    fullName: 'Nguyễn Văn Tuấn',
    collectiveName: 'Liên chi hội Phân hiệu ĐHĐN tại Kon Tum',
    institutionId: 'inst-kontum',
    institutionName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    schoolReviewUnitId: 'unit-kontum',
    schoolReviewUnitName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
  },
];

export const SEEDED_STUDENTS: Array<{
  id: string;
  email: string;
  fullName: string;
  studentCode: string;
  institutionId: string;
  institutionName: string;
  unitId: string;
  unitLabel: string;
}> = [
  {
    id: 'stu-dut-01',
    email: 'minh.nv@dut.udn.vn',
    fullName: 'Nguyễn Minh Anh',
    studentCode: '102220123',
    institutionId: 'inst-dut',
    institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
    unitId: 'unit-dut',
    unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
  },
  {
    id: 'stu-dut-02',
    email: 'sv.dut@dut.udn.vn',
    fullName: 'Phạm Quốc Đạt',
    studentCode: '102220301',
    institutionId: 'inst-dut',
    institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
    unitId: 'unit-dut',
    unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
  },
  {
    id: 'stu-due-01',
    email: 'sv.due@due.udn.vn',
    fullName: 'Lê Thị Bảo Ngọc',
    studentCode: '211121045120',
    institutionId: 'inst-due',
    institutionName: 'Trường Đại học Kinh tế – ĐHĐN',
    unitId: 'unit-due',
    unitLabel: 'Trường Đại học Kinh tế – ĐHĐN',
  },
  {
    id: 'stu-ued-01',
    email: 'sv.ued@ued.udn.vn',
    fullName: 'Trần Quốc Bảo',
    studentCode: '3140122089',
    institutionId: 'inst-ued',
    institutionName: 'Trường Đại học Sư phạm – ĐHĐN',
    unitId: 'unit-ued',
    unitLabel: 'Trường Đại học Sư phạm – ĐHĐN',
  },
  {
    id: 'stu-ufl-01',
    email: 'sv.ufl@ufl.udn.vn',
    fullName: 'Phạm Ngọc Hà My',
    studentCode: '411220156',
    institutionId: 'inst-ufl',
    institutionName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    unitId: 'unit-ufl',
    unitLabel: 'Trường Đại học Ngoại ngữ – ĐHĐN',
  },
  {
    id: 'stu-ute-01',
    email: 'sv.ute@ute.udn.vn',
    fullName: 'Võ Văn Kiệt',
    studentCode: '221150531201',
    institutionId: 'inst-ute',
    institutionName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    unitId: 'unit-ute',
    unitLabel: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
  },
  {
    id: 'stu-vku-01',
    email: 'sv.vku@vku.udn.vn',
    fullName: 'Hoàng Gia Bảo',
    studentCode: '22IT088',
    institutionId: 'inst-vku',
    institutionName: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
    unitId: 'unit-vku',
    unitLabel: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
  },
  {
    id: 'stu-smp-01',
    email: 'sv.smp@smp.udn.vn',
    fullName: 'Đặng Thùy Dương',
    studentCode: '21YK042',
    institutionId: 'inst-smp',
    institutionName: 'Trường Y Dược – ĐHĐN',
    unitId: 'unit-smp',
    unitLabel: 'Trường Y Dược – ĐHĐN',
  },
  {
    id: 'stu-vnuk-01',
    email: 'sv.vnuk@vnuk.udn.vn',
    fullName: 'Phan Minh Khôi',
    studentCode: '22VNUK019',
    institutionId: 'inst-vnuk',
    institutionName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    unitId: 'unit-vnuk',
    unitLabel: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
  },
  {
    id: 'stu-kontum-01',
    email: 'sv.kontum@kontum.udn.vn',
    fullName: 'Nguyễn Minh Quân',
    studentCode: '22KT015',
    institutionId: 'inst-kontum',
    institutionName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    unitId: 'unit-kontum',
    unitLabel: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
  },
];

export function createDefaultCriteriaList() {
  return [
    { id: 'ethics', number: 1, name: 'Đạo đức tốt', requirements: [] },
    { id: 'academic', number: 2, name: 'Học tập tốt', requirements: [] },
    { id: 'physical', number: 3, name: 'Thể lực tốt', requirements: [] },
    { id: 'volunteer', number: 4, name: 'Tình nguyện tốt', requirements: [] },
    { id: 'integration', number: 5, name: 'Hội nhập tốt', requirements: [] },
  ];
}

export function createDefaultCriteriaReviewList() {
  return [
    {
      criterionId: 'ethics',
      criterionNumber: 1,
      criterionName: 'Đạo đức tốt',
      status: 'not_reviewed',
      declaredCount: 0,
      evidenceCount: 0,
    },
    {
      criterionId: 'academic',
      criterionNumber: 2,
      criterionName: 'Học tập tốt',
      status: 'not_reviewed',
      declaredCount: 0,
      evidenceCount: 0,
    },
    {
      criterionId: 'physical',
      criterionNumber: 3,
      criterionName: 'Thể lực tốt',
      status: 'not_reviewed',
      declaredCount: 0,
      evidenceCount: 0,
    },
    {
      criterionId: 'volunteer',
      criterionNumber: 4,
      criterionName: 'Tình nguyện tốt',
      status: 'not_reviewed',
      declaredCount: 0,
      evidenceCount: 0,
    },
    {
      criterionId: 'integration',
      criterionNumber: 5,
      criterionName: 'Hội nhập tốt',
      status: 'not_reviewed',
      declaredCount: 0,
      evidenceCount: 0,
    },
  ];
}

export function createEmptyCollectiveRequirements() {
  return {
    tt01: {
      isRecognizedSchoolLevel: false,
      recognizedAcademicYear: '2025–2026',
      issuingUnitName: '',
      decisionNumber: '',
      decisionDate: '',
      evidenceFiles: [],
    },
    tt02: {
      totalMembers: 0,
      participatingCount: 0,
      censusDate: '',
      structuredMembers: [],
      evidenceFiles: [],
    },
    tt03: {
      recognizedCount: 0,
      structuredRecognizedMembers: [],
      evidenceFiles: [],
    },
    tt04: {
      noViolationsConfirmed: false,
      confirmingUnitName: '',
      confirmationDate: '',
      evidenceFiles: [],
    },
  };
}

function buildSeededIndividualStaffRecords(): Array<Record<string, any>> {
  return [];
}

function buildSeededStudentApplications(): Record<string, Record<string, any>> {
  return {};
}

export interface PortalRegisteredStudent {
  id: string;
  fullName: string;
  email: string;
  studentCode: string;
  institutionId: string;
  institutionName: string;
  password?: string;
  profile?: Record<string, any>;
}

export interface PortalState {
  sessions: Map<string, PortalAuthSessionPayload>;
  registeredStudents: Map<string, PortalRegisteredStudent>;
  studentProfiles: Map<string, Record<string, any>>;
  individualStaffRecords: Array<Record<string, any>>;
  studentApplications: Record<string, Record<string, any>>;
  collectiveApplications: Array<Record<string, any>>;
  evidenceIndex: Map<string, StoredEvidenceRecord>;
  auditLogs: PortalAuditLogRecord[];
}

const PORTAL_STATE_FILE_PATH = path.resolve(os.tmpdir(), '5tot-dhdn-portal-state.json');

export const portalState: PortalState = {
  sessions: new Map(),
  registeredStudents: new Map(),
  studentProfiles: new Map(),
  individualStaffRecords: buildSeededIndividualStaffRecords(),
  studentApplications: buildSeededStudentApplications(),
  collectiveApplications: [],
  evidenceIndex: new Map(),
  auditLogs: [
    {
      id: 'aud-seed-init',
      timestamp: new Date().toISOString(),
      track: 'SYSTEM',
      action: 'BACKEND_DB_INITIALIZED',
      actorId: 'system',
      actorName: 'Hệ thống 5TOT Đại học Đà Nẵng',
      actorRole: 'ADMIN',
      details: 'Khởi tạo cơ sở dữ liệu chế độ Real Backend V2 (Cấp Đại học Đà Nẵng — 0 hồ sơ mẫu).',
    },
  ],
};

export function mergeStudentProfileObjects(
  base?: Record<string, any> | null,
  override?: Record<string, any> | null
): Record<string, any> {
  const b = base || {};
  const o = override || {};
  const pickStr = (key: string, fallback = '') => {
    const ov = o[key];
    if (typeof ov === 'string' && ov.trim() !== '') return ov.trim();
    const bv = b[key];
    if (typeof bv === 'string' && bv.trim() !== '') return bv.trim();
    return fallback;
  };
  const pickNum = (key: string, fallback = 0) => {
    const ov = Number(o[key]);
    if (!Number.isNaN(ov) && ov > 0) return ov;
    const bv = Number(b[key]);
    if (!Number.isNaN(bv) && bv > 0) return bv;
    return fallback;
  };
  const instId = pickStr('institutionId', 'inst-dut');
  return {
    fullName: pickStr('fullName'),
    gender: pickStr('gender'),
    dateOfBirth: pickStr('dateOfBirth'),
    ethnicity: pickStr('ethnicity'),
    academicYearNumber: pickNum('academicYearNumber', 0),
    educationLevel: pickStr('educationLevel'),
    className: pickStr('className'),
    homeProvince: pickStr('homeProvince'),
    institutionId: instId,
    institutionName:
      pickStr('institutionName') || SCHOOL_UNIT_MAP[instId]?.instName || '',
    unionPosition: pickStr('unionPosition'),
    politicalStatus: pickStr('politicalStatus'),
    phoneNumber: pickStr('phoneNumber'),
    email: pickStr('email'),
  };
}

export function resolveSavedStudentProfileFromPortalState(keys: {
  userId?: string;
  email?: string;
  studentCode?: string;
}): Record<string, any> | null {
  const candidates: string[] = [];
  if (keys.userId) candidates.push(`id:${keys.userId}`);
  if (keys.email) candidates.push(`email:${keys.email.trim().toLowerCase()}`);
  if (keys.studentCode) candidates.push(`code:${keys.studentCode.trim().toUpperCase()}`);

  for (const key of candidates) {
    const found = portalState.studentProfiles.get(key);
    if (found) return found;
  }

  if (keys.email) {
    const reg = portalState.registeredStudents.get(keys.email.trim().toLowerCase());
    if (reg?.profile) return reg.profile;
  }

  if (keys.studentCode) {
    const app = portalState.studentApplications[`APP-2026-DN-${keys.studentCode.trim()}`];
    if (app?.applicantProfileSnapshot) {
      return app.applicantProfileSnapshot;
    }
  }

  return null;
}

export function syncStudentProfileInPortalState(
  profile: Record<string, any>,
  keys: { userId?: string; email?: string; studentCode?: string }
): Record<string, any> {
  const resolvedEmail = (keys.email || profile.email || '').trim().toLowerCase();
  let resolvedCode = (keys.studentCode || '').trim();

  if (!resolvedCode && resolvedEmail) {
    const reg = portalState.registeredStudents.get(resolvedEmail);
    if (reg?.studentCode) resolvedCode = reg.studentCode;
  }
  if (!resolvedCode && keys.userId) {
    for (const reg of portalState.registeredStudents.values()) {
      if (reg.id === keys.userId && reg.studentCode) {
        resolvedCode = reg.studentCode;
        break;
      }
    }
  }

  const existing = resolveSavedStudentProfileFromPortalState({
    userId: keys.userId,
    email: resolvedEmail,
    studentCode: resolvedCode,
  });
  const merged = mergeStudentProfileObjects(existing, profile);

  if (keys.userId) {
    portalState.studentProfiles.set(`id:${keys.userId}`, merged);
  }
  if (resolvedEmail) {
    portalState.studentProfiles.set(`email:${resolvedEmail}`, merged);
    const reg = portalState.registeredStudents.get(resolvedEmail);
    if (reg) {
      reg.fullName = merged.fullName || reg.fullName;
      reg.institutionId = merged.institutionId || reg.institutionId;
      reg.institutionName = merged.institutionName || reg.institutionName;
      reg.profile = merged;
    }
  }
  if (resolvedCode) {
    portalState.studentProfiles.set(`code:${resolvedCode.toUpperCase()}`, merged);
  }

  // Sync matching studentApplications & individualStaffRecords
  for (const [appId, app] of Object.entries(portalState.studentApplications)) {
    const appEmail = String(
      app.student?.email || app.applicantProfileSnapshot?.email || ''
    )
      .trim()
      .toLowerCase();
    const appCode = String(
      app.student?.studentId || app.student?.studentCode || appId.replace(/^APP-\d{4}-DN-/, '')
    ).trim();
    if (
      (resolvedEmail && appEmail === resolvedEmail) ||
      (resolvedCode && appCode.toUpperCase() === resolvedCode.toUpperCase())
    ) {
      app.applicantProfileSnapshot = mergeStudentProfileObjects(
        app.applicantProfileSnapshot,
        merged
      );
      if (app.student) {
        if (merged.fullName) app.student.fullName = merged.fullName;
        if (merged.className) app.student.class = merged.className;
        if (merged.institutionName) app.student.university = merged.institutionName;
        if (merged.email) app.student.email = merged.email;
      }
      if (merged.institutionName) {
        app.trainingInstitutionName = merged.institutionName;
      }
    }
  }

  for (const rec of portalState.individualStaffRecords) {
    const recEmail = String(
      rec.student?.email || rec.applicantProfileSnapshot?.email || ''
    )
      .trim()
      .toLowerCase();
    const recCode = String(rec.student?.studentCode || '').trim();
    if (
      (resolvedEmail && recEmail === resolvedEmail) ||
      (resolvedCode && recCode.toUpperCase() === resolvedCode.toUpperCase())
    ) {
      rec.applicantProfileSnapshot = mergeStudentProfileObjects(
        rec.applicantProfileSnapshot,
        merged
      );
      if (rec.student && merged.fullName) {
        rec.student.fullName = merged.fullName;
      }
    }
  }

  savePortalStateToDisk();
  return merged;
}

let lastSavedPortalStateDiskJson = '';

export function savePortalStateToDisk(): void {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const dir = path.dirname(PORTAL_STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = {
      sessions: Array.from(portalState.sessions.entries()).slice(-200),
      registeredStudents: Array.from(portalState.registeredStudents.entries()),
      studentProfiles: Array.from(portalState.studentProfiles.entries()),
      individualStaffRecords: portalState.individualStaffRecords,
      studentApplications: portalState.studentApplications,
      collectiveApplications: portalState.collectiveApplications,
      evidenceIndex: Array.from(portalState.evidenceIndex.entries()),
      auditLogs: portalState.auditLogs.slice(0, 500),
    };
    const serialized = JSON.stringify(payload, null, 2);
    if (serialized !== lastSavedPortalStateDiskJson) {
      lastSavedPortalStateDiskJson = serialized;
      fs.writeFileSync(PORTAL_STATE_FILE_PATH, serialized, 'utf8');
    }
  } catch {
    // Ignore disk write errors in read-only environments
  }
  schedulePortalStateNeonDbSync();
}

export function loadPortalStateFromDisk(): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  try {
    if (!fs.existsSync(PORTAL_STATE_FILE_PATH)) return false;
    const raw = fs.readFileSync(PORTAL_STATE_FILE_PATH, 'utf8');
    lastSavedPortalStateDiskJson = raw;
    const parsed = JSON.parse(raw) as {
      sessions?: Array<[string, PortalAuthSessionPayload]>;
      registeredStudents?: Array<[string, PortalRegisteredStudent]>;
      studentProfiles?: Array<[string, Record<string, any>]>;
      individualStaffRecords?: Array<Record<string, any>>;
      studentApplications?: Record<string, Record<string, any>>;
      collectiveApplications?: Array<Record<string, any>>;
      evidenceIndex?: Array<[string, StoredEvidenceRecord]>;
      auditLogs?: PortalAuditLogRecord[];
    };
    if (Array.isArray(parsed.sessions)) {
      portalState.sessions = new Map(parsed.sessions);
    }
    if (Array.isArray(parsed.registeredStudents)) {
      portalState.registeredStudents = new Map(parsed.registeredStudents);
    }
    if (Array.isArray(parsed.studentProfiles)) {
      portalState.studentProfiles = new Map(parsed.studentProfiles);
    }
    if (Array.isArray(parsed.individualStaffRecords)) {
      portalState.individualStaffRecords = parsed.individualStaffRecords.map(
        (rec) => {
          if (rec?.assignment?.officerId) {
            return {
              ...rec,
              assignment: {
                ...rec.assignment,
                officerId: 'staff-off-nam',
                officerName: 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
                assignedBy: 'Quản lý xét duyệt cấp Đại học Đà Nẵng',
              },
              latestOperationalNote:
                typeof rec.latestOperationalNote === 'string' &&
                rec.latestOperationalNote.includes('Phân công')
                  ? 'Đã phân công cho Cán bộ xét duyệt cấp Đại học Đà Nẵng'
                  : rec.latestOperationalNote,
            };
          }
          return rec;
        }
      );
    }
    if (parsed.studentApplications && typeof parsed.studentApplications === 'object') {
      portalState.studentApplications = parsed.studentApplications;
    }
    if (Array.isArray(parsed.collectiveApplications)) {
      portalState.collectiveApplications = parsed.collectiveApplications.map(
        (col) => {
          if (col?.assignedOfficerId) {
            return {
              ...col,
              assignedOfficerId: 'staff-off-nam',
              assignedOfficerName: 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
            };
          }
          return col;
        }
      );
    }
    if (Array.isArray(parsed.evidenceIndex)) {
      portalState.evidenceIndex = new Map(parsed.evidenceIndex);
    }
    if (Array.isArray(parsed.auditLogs)) {
      portalState.auditLogs = parsed.auditLogs;
    }
    return true;
  } catch {
    return false;
  }
}

// Automatically load persisted state from local cache AND Neon PostgreSQL DB on server startup
loadPortalStateFromDisk();
queueMicrotask(() => {
  void ensurePortalStateHydratedFromNeonDb();
});

export function clearDomainPortalStateForSeed(): void {
  portalState.sessions = new Map();
  portalState.registeredStudents = new Map();
  portalState.studentProfiles = new Map();
  portalState.individualStaffRecords = [];
  portalState.studentApplications = {};
  portalState.collectiveApplications = [];
  portalState.evidenceIndex = new Map();
  portalState.auditLogs = [
    {
      id: `aud-clean-${Date.now()}`,
      timestamp: new Date().toISOString(),
      track: 'SYSTEM',
      action: 'CLEAN_SLATE_INITIALIZED',
      actorId: 'system',
      actorName: 'Hệ thống 5TOT Đại học Đà Nẵng',
      actorRole: 'ADMIN',
      details: 'Đã làm sạch toàn bộ dữ liệu mẫu để khởi tạo dữ liệu thật qua REST API.',
    },
  ];
  void clearPortalPersistentRecordsInNeonDb();
  savePortalStateToDisk();
}

export function resetDomainPortalState(): void {
  portalState.sessions = new Map();
  portalState.registeredStudents = new Map();
  portalState.studentProfiles = new Map();
  portalState.individualStaffRecords = buildSeededIndividualStaffRecords();
  portalState.studentApplications = buildSeededStudentApplications();
  portalState.collectiveApplications = [];
  portalState.evidenceIndex = new Map();
  portalState.auditLogs = [
    {
      id: 'aud-seed-init',
      timestamp: new Date().toISOString(),
      track: 'SYSTEM',
      action: 'BACKEND_DB_INITIALIZED',
      actorId: 'system',
      actorName: 'Hệ thống 5TOT Đại học Đà Nẵng',
      actorRole: 'ADMIN',
      details: 'Khởi tạo cơ sở dữ liệu chế độ Real Backend V2 (Cấp Đại học Đà Nẵng — 0 hồ sơ mẫu).',
    },
  ];
}

export function appendPortalAuditLog(
  entry: Omit<PortalAuditLogRecord, 'id' | 'timestamp'>
): PortalAuditLogRecord {
  const record: PortalAuditLogRecord = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  portalState.auditLogs.unshift(record);
  savePortalStateToDisk();
  return record;
}

export function resolveSessionActor(req: Request): {
  id: string;
  name: string;
  email: string;
  role: string;
  unitId?: string;
  authenticated: boolean;
} {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const session = portalState.sessions.get(token);
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.fullName,
        email: session.user.email,
        role: session.user.role,
        unitId: session.user.unitId,
        authenticated: true,
      };
    }

    try {
      const decoded = jwt.decode(token) as Record<string, any> | null;
      if (decoded && typeof decoded.sub === 'string' && typeof decoded.activeRole === 'string') {
        const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
        const reg = email ? portalState.registeredStudents.get(email) : undefined;
        const staff = email
          ? STAFF_SEED_ACCOUNTS.find((s) => s.email.toLowerCase() === email)
          : undefined;
        const instId =
          reg?.institutionId ||
          (typeof decoded.institutionId === 'string' ? decoded.institutionId : undefined);
        const unitId =
          (typeof decoded.schoolReviewUnitId === 'string' ? decoded.schoolReviewUnitId : undefined) ||
          staff?.unitId ||
          (instId ? SCHOOL_UNIT_MAP[instId]?.unitId : undefined);
        const fullName =
          reg?.fullName ||
          (typeof decoded.fullName === 'string' ? decoded.fullName : '') ||
          staff?.fullName ||
          email ||
          'Người dùng đã xác thực';
        return {
          id: decoded.sub,
          name: fullName,
          email,
          role: decoded.activeRole,
          unitId,
          authenticated: true,
        };
      }
    } catch {
      // Ignore invalid JWT format
    }
  }
  return {
    id: 'actor-system',
    name: 'Cán bộ nghiệp vụ',
    email: '',
    role: 'CITY_OFFICER',
    authenticated: false,
  };
}

export function requireAllowedRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const actor = resolveSessionActor(req);
    if (actor.authenticated && !allowedRoles.includes(actor.role)) {
      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN_ROLE',
        code: 'FORBIDDEN_ROLE',
        error: `Vai trò "${actor.role}" không có thẩm quyền thực hiện thao tác này.`,
      });
      return;
    }
    next();
  };
}

export async function issueZeroTrustJwtToken(
  deps: { sessionService: SessionService; identityRepo: IIdentityRepository },
  params: {
    id: string;
    email: string;
    fullName: string;
    role: SystemRoleCode;
    institutionId?: string;
    unitId?: string;
    studentCode?: string;
    password?: string;
  }
): Promise<{ userId: string; accessToken: string }> {
  try {
    let existing = await deps.identityRepo.findByEmail(params.email);
    if (!existing && params.studentCode) {
      existing = await deps.identityRepo.findByStudentCode(params.studentCode);
    }
    if (!existing) {
      const passwordHash = await defaultPasswordHasher.hash(params.password || 'MatKhau@2026');
      if (params.role === 'STUDENT') {
        existing = await deps.identityRepo.createStudent({
          email: params.email,
          passwordHash,
          fullName: params.fullName,
          studentCode: params.studentCode || `SV-${Date.now().toString(36)}`,
          institutionId: params.institutionId || 'inst-dut',
        });
      } else {
        existing = await deps.identityRepo.createStaffUser({
          email: params.email,
          passwordHash,
          fullName: params.fullName,
          roleCode: params.role,
          institutionId: params.institutionId,
          schoolReviewUnitId: params.unitId,
          grantedByUserId: 'system-portal',
        });
      }
    } else {
      if (params.password) {
        const matchesExisting = existing.passwordHash
          ? await defaultPasswordHasher
              .verify(existing.passwordHash, params.password)
              .catch(() => false)
          : false;
        if (!matchesExisting) {
          const nextHash = await defaultPasswordHasher.hash(params.password);
          await deps.identityRepo.updatePasswordHash(existing.id, nextHash).catch(() => {});
          existing = { ...existing, passwordHash: nextHash };
        }
      }
      const roles = await deps.identityRepo.getUserRoles(existing.id).catch(() => []);
      if (!roles.some((r) => r.isActive && r.roleCode === params.role)) {
        await deps.identityRepo
          .addRoleAssignment(existing.id, params.role, params.unitId || null, 'system-portal')
          .catch(() => {});
      }
    }
    if (existing && params.fullName && existing.fullName !== params.fullName) {
      existing = { ...existing, fullName: params.fullName };
    }
    const tokens = await deps.sessionService.createSession(
      existing,
      [params.role],
      params.role,
      {},
      params.unitId
    );
    return { userId: existing.id, accessToken: tokens.accessToken };
  } catch {
    const fallbackToken = `v2-portal-token-${params.id}-${Date.now()}`;
    return { userId: params.id, accessToken: fallbackToken };
  }
}
