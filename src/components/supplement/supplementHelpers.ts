/**
 * 5TOT ĐHĐN — Supplement Request & Declaration Matching Helpers
 */

export function isMatchingDeclarationId(
  targetDeclId?: string | null,
  declId?: string | null
): boolean {
  if (!targetDeclId || !declId) return false;
  if (targetDeclId === declId) return true;
  if (targetDeclId.endsWith(`__${declId}`) || declId.endsWith(`__${targetDeclId}`)) return true;

  const strippedTarget = targetDeclId.includes('__')
    ? targetDeclId.split('__').slice(1).join('__')
    : targetDeclId;
  const strippedDecl = declId.includes('__')
    ? declId.split('__').slice(1).join('__')
    : declId;

  return strippedTarget === strippedDecl;
}

export function isMatchingRequirementId(
  targetReqId?: string | null,
  reqId?: string | null
): boolean {
  if (!targetReqId || !reqId) return false;
  if (targetReqId === reqId) return true;
  return targetReqId.toLowerCase() === reqId.toLowerCase();
}

export type StandardSupplementAction =
  | 'addEvidence'
  | 'editDeclaration'
  | 'addDeclaration'
  | 'replaceEvidence'
  | 'confirmEvidence';

export function isSupplementActionAllowed(
  allowedActions: string[] | undefined | null,
  action: StandardSupplementAction
): boolean {
  if (!allowedActions || !Array.isArray(allowedActions) || allowedActions.length === 0) {
    return true; // Default permissive when officer did not restrict specific sub-actions
  }

  return allowedActions.some((act) => {
    if (!act) return false;
    const a = act.toLowerCase().trim();

    if (action === 'addEvidence') {
      return (
        a === 'addevidence' ||
        a === 'replaceevidence' ||
        a.includes('minh chứng') ||
        a.includes('tài liệu') ||
        a.includes('tệp')
      );
    }

    if (action === 'editDeclaration') {
      return (
        a === 'editdeclaration' ||
        a.includes('kê khai') ||
        a.includes('chỉnh sửa') ||
        a.includes('sửa')
      );
    }

    if (action === 'addDeclaration') {
      return (
        a === 'adddeclaration' ||
        a.includes('thêm hoạt động') ||
        a.includes('thêm kê khai')
      );
    }

    if (action === 'replaceEvidence') {
      return (
        a === 'replaceevidence' ||
        a === 'addevidence' ||
        a.includes('thay thế') ||
        a.includes('minh chứng')
      );
    }

    if (action === 'confirmEvidence') {
      return (
        a === 'confirmevidence' ||
        a === 'addevidence' ||
        a.includes('xác nhận') ||
        a.includes('minh chứng')
      );
    }

    return a === action.toLowerCase();
  });
}
