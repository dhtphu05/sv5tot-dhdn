/**
 * 5TOT ĐHĐN — Admin Control Plane Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import type { AdminService } from './admin.service';
import type { IAdminRepository } from './admin.repository';
import type { AdminApplicationHotfixService } from './adminApplicationHotfix.service';
import { CopyAwardSeasonSchema } from '../seasons/season.schemas';
import {
  InitializeFirstAdminSchema,
  ProvisionStaffAccountSchema,
  ActivateStaffInviteSchema,
  ResetStaffPasswordSchema,
  UpdateStaffRoleSchema,
  UpdateStaffStatusSchema,
  UpdateNotificationTemplateSchema,
  PreviewNotificationTemplateSchema,
  UpdateWorkflowPolicySchema,
  CreateOperationalApplicationSchema,
  HotfixOperationalApplicationSchema,
  DeleteOperationalApplicationSchema,
} from './admin.schemas';

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminRepo: IAdminRepository,
    private readonly appHotfixService?: AdminApplicationHotfixService
  ) {}

  public getBootstrapStatus: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = await this.adminService.getBootstrapStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  });

  public initializeFirstAdmin: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = InitializeFirstAdminSchema.parse(req.body);
    const result = await this.adminService.initializeFirstAdmin(body);
    res.status(201).json({
      success: true,
      data: result,
    });
  });

  public getControlPlaneSnapshot: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const snapshot = await this.adminService.getControlPlaneSnapshot();
    res.status(200).json({
      success: true,
      data: snapshot,
    });
  });

  public getSeasonReadiness: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const report = await this.adminService.evaluateSeasonReadiness(id);
    res.status(200).json({
      success: true,
      data: report,
    });
  });

  public copyAndPrepareSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = CopyAwardSeasonSchema.parse(req.body);
    const result = await this.adminService.copyAndPrepareSeason(req.actor!, body);
    res.status(201).json({
      success: true,
      data: result,
    });
  });

  public activateSeasonWithReadiness: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await this.adminService.activateSeasonWithReadinessCheck(req.actor!, id);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public listStaffAccounts: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const staff = await this.adminService.listStaffAccounts();
    res.status(200).json({
      success: true,
      data: { staff },
    });
  });

  public provisionStaffAccount: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = ProvisionStaffAccountSchema.parse(req.body);
    const result = await this.adminService.provisionStaffAccount(req.actor!, body);
    res.status(201).json({
      success: true,
      data: result,
    });
  });

  public activateStaffInvite: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = ActivateStaffInviteSchema.parse(req.body);
    const result = await this.adminService.activateStaffInvite(body);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public resendStaffInvite: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await this.adminService.resendStaffInvite(req.actor!, id);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public resetStaffPassword: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = ResetStaffPasswordSchema.parse(req.body || {});
    const result = await this.adminService.resetStaffPassword(
      req.actor!,
      id,
      body.newTemporaryPassword
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public updateStaffRole: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = UpdateStaffRoleSchema.parse(req.body);
    const staff = await this.adminService.updateStaffRole(req.actor!, id, body);
    res.status(200).json({
      success: true,
      data: { staff },
    });
  });

  public updateStaffStatus: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = UpdateStaffStatusSchema.parse(req.body);
    const staff = await this.adminService.updateStaffStatus(
      req.actor!,
      id,
      body.status,
      body.reason
    );
    res.status(200).json({
      success: true,
      data: { staff },
    });
  });

  public listNotificationTemplates: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const templates = await this.adminService.listNotificationTemplates();
    res.status(200).json({
      success: true,
      data: { templates },
    });
  });

  public updateNotificationTemplate: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = UpdateNotificationTemplateSchema.parse(req.body);
    const template = await this.adminService.updateNotificationTemplate(req.actor!, id, body);
    res.status(200).json({
      success: true,
      data: { template },
    });
  });

  public previewNotificationTemplate: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = PreviewNotificationTemplateSchema.parse(req.body || {});
    const preview = await this.adminService.previewNotificationTemplate(id, body.sampleVariables);
    res.status(200).json({
      success: true,
      data: preview,
    });
  });

  public getWorkflowPolicy: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const policy = await this.adminService.getWorkflowPolicy();
    res.status(200).json({
      success: true,
      data: { policy },
    });
  });

  public updateWorkflowPolicy: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = UpdateWorkflowPolicySchema.parse(req.body);
    const policy = await this.adminService.updateWorkflowPolicy(req.actor!, body);
    res.status(200).json({
      success: true,
      data: { policy },
    });
  });

  public getSystemHealth: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const diagnostics = this.adminService.getSystemHealthDiagnostics();
    res.status(200).json({
      success: true,
      data: { diagnostics },
    });
  });

  public exportReferenceData: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const catalog = await this.adminService.exportReferenceDataCatalog();
    res.status(200).json({
      success: true,
      data: catalog,
    });
  });

  public listAdminAuditEvents: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const events = await this.adminRepo.listAdminAuditEvents();
    res.status(200).json({
      success: true,
      data: { events },
    });
  });

  public listOperationalApplications: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const applications = this.appHotfixService
      ? await this.appHotfixService.listOperationalApplications({
          seasonId: typeof req.query.seasonId === 'string' ? req.query.seasonId : undefined,
          institutionId: typeof req.query.institutionId === 'string' ? req.query.institutionId : undefined,
          schoolReviewUnitId: typeof req.query.schoolReviewUnitId === 'string' ? req.query.schoolReviewUnitId : undefined,
        })
      : [];
    res.status(200).json({
      success: true,
      data: { applications },
    });
  });

  public createOperationalApplication: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = CreateOperationalApplicationSchema.parse(req.body);
    const application = await this.appHotfixService!.createOperationalApplication(req.actor!, body);
    res.status(201).json({
      success: true,
      data: { application },
    });
  });

  public hotfixOperationalApplication: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = HotfixOperationalApplicationSchema.parse(req.body);
    const application = await this.appHotfixService!.hotfixOperationalApplication(req.actor!, id, body);
    res.status(200).json({
      success: true,
      data: { application },
    });
  });

  public deleteOperationalApplication: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = DeleteOperationalApplicationSchema.parse(req.body || {});
    const result = await this.appHotfixService!.deleteOperationalApplication(req.actor!, id, body.reason);
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
