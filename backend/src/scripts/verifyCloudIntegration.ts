/**
 * 5TOT ĐHĐN — Neon Database & Cloudflare R2 Live Integration Verification Script
 * Chạy lệnh: npm run verify:cloud (trong thư mục /backend) sau khi điền .env
 */

import 'dotenv/config';
import { getEnvironment } from '../config/environment';
import { dbManager } from '../shared/database/prismaClient';
import { r2StorageClient } from '../shared/storage/r2StorageClient';

async function main(): Promise<void> {
  console.log('====================================================================');
  console.log(' 5TOT ĐÀ NẴNG — KIỂM TRA KẾT NỐI NEON DATABASE & CLOUDFLARE R2');
  console.log('====================================================================\n');

  const env = getEnvironment();
  console.log(`• Môi trường (NODE_ENV):          ${env.NODE_ENV}`);
  console.log(`• Chế độ DB (DATABASE_MODE):      ${env.BACKEND_DATABASE_MODE}`);
  console.log(`• Bucket Cloudflare R2:           ${env.R2_BUCKET_NAME}`);
  console.log(`• Endpoint Cloudflare R2:         ${env.R2_ENDPOINT || '(chưa cấu hình R2_ACCOUNT_ID)'}\n`);

  // 1. Kiểm tra Neon Database
  console.log('[1/2] Đang kiểm tra kết nối Neon PostgreSQL...');
  const dbStatus = await dbManager.checkConnection();
  if (dbStatus.connected) {
    console.log(`  ✅ Kết nối Neon PostgreSQL THÀNH CÔNG (${dbStatus.latencyMs}ms)`);
    console.log(`     - Database: ${dbStatus.database || 'neondb'}`);
    console.log(`     - Phiên bản: ${dbStatus.serverVersion || 'PostgreSQL'}`);
  } else {
    console.error(`  ❌ Kết nối Neon PostgreSQL THẤT BẠI: ${dbStatus.error}`);
  }

  // 2. Kiểm tra Cloudflare R2
  console.log('\n[2/2] Đang kiểm tra kết nối Cloudflare R2 & Presigned URL...');
  const r2Status = await r2StorageClient.checkConnectivity();
  if (r2Status.connected) {
    console.log(`  ✅ Kết nối Cloudflare R2 Bucket "${r2Status.bucket}" THÀNH CÔNG (${r2Status.latencyMs}ms)`);
  } else {
    console.error(`  ❌ Kết nối Cloudflare R2 THẤT BẠI: ${r2Status.error}`);
  }

  if (r2StorageClient.isConfigured()) {
    const samplePdfIntent = await r2StorageClient.createPresignedPutUrl({
      objectKey: 'evidence/individual/smoke-test/sample-minh-chung.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
    });
    const sampleGetUrl = await r2StorageClient.createPresignedGetUrl({
      objectKey: 'evidence/individual/smoke-test/sample-minh-chung.pdf',
      fileName: 'sample-minh-chung.pdf',
      mimeType: 'application/pdf',
    });
    console.log(`  ✅ Sinh Presigned PUT URL (PDF/Ảnh, TTL=${samplePdfIntent.expiresInSeconds}s) thành công.`);
    console.log(`  ✅ Sinh Presigned GET URL (Inline Viewer, TTL=${sampleGetUrl.expiresInSeconds}s) thành công.`);
  }

  await dbManager.disconnect();
  console.log('\n====================================================================');

  if (!dbStatus.connected || !r2Status.connected) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Lỗi không mong đợi khi kiểm tra tích hợp:', err);
  process.exitCode = 1;
});
