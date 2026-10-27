/**
 * 5TOT ĐHĐN — Prisma Evidence Repository Implementation (Backend V2)
 *
 * Implements authoritative queries for:
 * - EvidenceObject private file metadata.
 * - EvidenceObjectVersion immutable version snapshots.
 * - ApplicationEvidenceLink junction links to declarations & requirements.
 *
 * Respects BACKEND_DATABASE_MODE="offline" safety gate.
 */

import type { PrismaClient } from '@prisma/client';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager, executeWithNeonRetry } from '../../shared/database/prismaClient';
import type { IEvidenceRepository } from './evidence.repository';
import type {
  EvidenceObjectDto,
  EvidenceObjectVersionDto,
  ApplicationEvidenceLinkDto,
  EvidenceScanStatus,
} from './evidence.types';

export class PrismaEvidenceRepository implements IEvidenceRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác hồ sơ minh chứng yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async createPendingObject(data: {
    ownerUserId: string;
    track: 'INDIVIDUAL' | 'COLLECTIVE';
    individualAppId?: string;
    collectiveAppId?: string;
    originalFileName: string;
    mimeType: string;
    extension: string;
    sizeBytes: number;
    sha256Checksum: string;
    bucketName: string;
    objectKey: string;
  }): Promise<EvidenceObjectDto> {
    const prisma = await this.getPrisma();
    const created = await executeWithNeonRetry(() =>
      prisma.evidenceObject.create({
        data: {
          ownerUserId: data.ownerUserId,
          track: data.track,
          individualAppId: data.individualAppId,
          collectiveAppId: data.collectiveAppId,
          originalFileName: data.originalFileName,
          mimeType: data.mimeType,
          extension: data.extension,
          sizeBytes: BigInt(data.sizeBytes),
          sha256Checksum: data.sha256Checksum,
          bucketName: data.bucketName,
          objectKey: data.objectKey,
          scanStatus: 'PENDING_UPLOAD',
          isFinalized: false,
        },
      })
    );

    return this.mapObjectDto(created);
  }

  public async findById(id: string): Promise<EvidenceObjectDto | null> {
    const prisma = await this.getPrisma();
    const obj = await executeWithNeonRetry(() =>
      prisma.evidenceObject.findUnique({
        where: { id },
      })
    );
    if (!obj) return null;
    return this.mapObjectDto(obj);
  }

  public async findByIds(ids: string[]): Promise<EvidenceObjectDto[]> {
    if (ids.length === 0) return [];
    const prisma = await this.getPrisma();
    const uniqueIds = Array.from(new Set(ids));
    const objs = await executeWithNeonRetry<any[]>(() =>
      prisma.evidenceObject.findMany({
        where: {
          id: { in: uniqueIds },
          deletedAt: null,
        },
      })
    );
    return objs.map((o: any) => this.mapObjectDto(o));
  }

  public async findByObjectKey(objectKey: string): Promise<EvidenceObjectDto | null> {
    const prisma = await this.getPrisma();
    const obj = await executeWithNeonRetry(() =>
      prisma.evidenceObject.findUnique({
        where: { objectKey },
      })
    );
    if (!obj) return null;
    return this.mapObjectDto(obj);
  }

  public async finalizeObject(
    id: string,
    data: {
      sha256Checksum: string;
      sizeBytes: number;
      scanStatus: EvidenceScanStatus;
    }
  ): Promise<EvidenceObjectDto> {
    const prisma = await this.getPrisma();
    const updated = await executeWithNeonRetry(() =>
      prisma.evidenceObject.update({
        where: { id },
        data: {
          sha256Checksum: data.sha256Checksum,
          sizeBytes: BigInt(data.sizeBytes),
          scanStatus: data.scanStatus,
          isFinalized: true,
          finalizedAt: new Date(),
        },
      })
    );

    return this.mapObjectDto(updated);
  }

  public async updateScanStatus(
    id: string,
    scanStatus: EvidenceScanStatus
  ): Promise<EvidenceObjectDto> {
    const prisma = await this.getPrisma();
    const updated = await executeWithNeonRetry(() =>
      prisma.evidenceObject.update({
        where: { id },
        data: { scanStatus },
      })
    );
    return this.mapObjectDto(updated);
  }

  public async finalizeObjectWithVersion(
    id: string,
    data: {
      sha256Checksum: string;
      sizeBytes: number;
      scanStatus: EvidenceScanStatus;
      versionNumber: number;
      originalFileName: string;
      mimeType: string;
      bucketName: string;
      objectKey: string;
      uploadedByUserId: string;
      changeReason?: string;
    }
  ): Promise<EvidenceObjectDto> {
    const prisma = await this.getPrisma();
    // Single network round-trip & atomic transaction on Neon PostgreSQL via nested write
    const updated = await executeWithNeonRetry(() =>
      prisma.evidenceObject.update({
        where: { id },
        data: {
          sha256Checksum: data.sha256Checksum,
          sizeBytes: BigInt(data.sizeBytes),
          scanStatus: data.scanStatus,
          isFinalized: true,
          finalizedAt: new Date(),
          versions: {
            create: {
              versionNumber: data.versionNumber,
              originalFileName: data.originalFileName,
              mimeType: data.mimeType,
              sizeBytes: BigInt(data.sizeBytes),
              sha256Checksum: data.sha256Checksum,
              bucketName: data.bucketName,
              objectKey: data.objectKey,
              scanStatus: data.scanStatus,
              uploadedByUserId: data.uploadedByUserId,
              changeReason: data.changeReason,
            },
          },
        },
      })
    );

    return this.mapObjectDto(updated);
  }

  public async createVersion(data: {
    evidenceObjectId: string;
    versionNumber: number;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    sha256Checksum: string;
    bucketName: string;
    objectKey: string;
    scanStatus: EvidenceScanStatus;
    uploadedByUserId: string;
    changeReason?: string;
  }): Promise<EvidenceObjectVersionDto> {
    const prisma = await this.getPrisma();
    const version = await prisma.evidenceObjectVersion.create({
      data: {
        evidenceObjectId: data.evidenceObjectId,
        versionNumber: data.versionNumber,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: BigInt(data.sizeBytes),
        sha256Checksum: data.sha256Checksum,
        bucketName: data.bucketName,
        objectKey: data.objectKey,
        scanStatus: data.scanStatus,
        uploadedByUserId: data.uploadedByUserId,
        changeReason: data.changeReason,
      },
    });

    return {
      id: version.id,
      evidenceObjectId: version.evidenceObjectId,
      versionNumber: version.versionNumber,
      originalFileName: version.originalFileName,
      mimeType: version.mimeType,
      sizeBytes: Number(version.sizeBytes),
      sha256Checksum: version.sha256Checksum,
      bucketName: version.bucketName,
      objectKey: version.objectKey,
      scanStatus: version.scanStatus as EvidenceScanStatus,
      uploadedByUserId: version.uploadedByUserId,
      uploadedAt: version.uploadedAt,
      changeReason: version.changeReason,
    };
  }

  public async linkToIndividualDeclaration(data: {
    evidenceObjectId: string;
    individualDeclarationItemId: string;
    linkedByUserId: string;
  }): Promise<ApplicationEvidenceLinkDto> {
    const prisma = await this.getPrisma();
    const link = await prisma.applicationEvidenceLink.create({
      data: {
        evidenceObjectId: data.evidenceObjectId,
        individualDeclarationItemId: data.individualDeclarationItemId,
        linkedByUserId: data.linkedByUserId,
      },
      include: {
        evidenceObject: true,
      },
    });

    return {
      id: link.id,
      evidenceObjectId: link.evidenceObjectId,
      individualDeclarationItemId: link.individualDeclarationItemId,
      linkedByUserId: link.linkedByUserId,
      linkedAt: link.linkedAt,
      evidenceObject: this.mapObjectDto(link.evidenceObject),
    };
  }

  public async linkToCollectiveRequirement(data: {
    evidenceObjectId: string;
    collectiveRequirementId: string;
    linkedByUserId: string;
  }): Promise<ApplicationEvidenceLinkDto> {
    const prisma = await this.getPrisma();
    const link = await prisma.applicationEvidenceLink.create({
      data: {
        evidenceObjectId: data.evidenceObjectId,
        collectiveRequirementId: data.collectiveRequirementId,
        linkedByUserId: data.linkedByUserId,
      },
      include: {
        evidenceObject: true,
      },
    });

    return {
      id: link.id,
      evidenceObjectId: link.evidenceObjectId,
      collectiveRequirementId: link.collectiveRequirementId,
      linkedByUserId: link.linkedByUserId,
      linkedAt: link.linkedAt,
      evidenceObject: this.mapObjectDto(link.evidenceObject),
    };
  }

  public async unlink(linkId: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.applicationEvidenceLink.update({
      where: { id: linkId },
      data: { unlinkedAt: new Date() },
    });
  }

  public async listLinksForDeclaration(declarationItemId: string): Promise<ApplicationEvidenceLinkDto[]> {
    const prisma = await this.getPrisma();
    const links = await prisma.applicationEvidenceLink.findMany({
      where: {
        individualDeclarationItemId: declarationItemId,
        unlinkedAt: null,
      },
      include: {
        evidenceObject: true,
      },
    });

    return links.map((l: any) => ({
      id: l.id,
      evidenceObjectId: l.evidenceObjectId,
      individualDeclarationItemId: l.individualDeclarationItemId,
      linkedByUserId: l.linkedByUserId,
      linkedAt: l.linkedAt,
      evidenceObject: this.mapObjectDto(l.evidenceObject),
    }));
  }

  public async listLinksForCollectiveRequirement(requirementId: string): Promise<ApplicationEvidenceLinkDto[]> {
    const prisma = await this.getPrisma();
    const links = await prisma.applicationEvidenceLink.findMany({
      where: {
        collectiveRequirementId: requirementId,
        unlinkedAt: null,
      },
      include: {
        evidenceObject: true,
      },
    });

    return links.map((l: any) => ({
      id: l.id,
      evidenceObjectId: l.evidenceObjectId,
      collectiveRequirementId: l.collectiveRequirementId,
      linkedByUserId: l.linkedByUserId,
      linkedAt: l.linkedAt,
      evidenceObject: this.mapObjectDto(l.evidenceObject),
    }));
  }

  public async listOwnerEvidence(ownerUserId: string): Promise<EvidenceObjectDto[]> {
    const prisma = await this.getPrisma();
    const objs = await prisma.evidenceObject.findMany({
      where: {
        ownerUserId,
        deletedAt: null,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return objs.map((o: any) => this.mapObjectDto(o));
  }

  private mapObjectDto(o: any): EvidenceObjectDto {
    return {
      id: o.id,
      ownerUserId: o.ownerUserId,
      track: o.track,
      individualAppId: o.individualAppId,
      collectiveAppId: o.collectiveAppId,
      currentVersionNo: o.currentVersionNo,
      originalFileName: o.originalFileName,
      mimeType: o.mimeType,
      extension: o.extension,
      sizeBytes: Number(o.sizeBytes),
      sha256Checksum: o.sha256Checksum,
      bucketName: o.bucketName,
      objectKey: o.objectKey,
      scanStatus: o.scanStatus,
      isFinalized: o.isFinalized,
      uploadedAt: o.uploadedAt,
      finalizedAt: o.finalizedAt,
      deletedAt: o.deletedAt,
    };
  }
}
