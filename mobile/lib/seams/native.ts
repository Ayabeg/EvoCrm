/**
 * Capability seams for later phases. No product implementation in M06R.
 * Calling these returns an explicit "not wired" result — never a silent mock.
 */

export type SeamStatus = 'not_wired';

export type SeamResult = {
  status: SeamStatus;
  capability: string;
  note: string;
};

function seam(capability: string, note: string): SeamResult {
  return { status: 'not_wired', capability, note };
}

export function cameraSeam(): SeamResult {
  return seam('camera', 'expo-image-picker / expo-camera will attach in a later phase. No capture UI in M06R.');
}

export function fileUploadSeam(): SeamResult {
  return seam(
    'file_upload',
    'Document picker + upload is not on /api/v1. Do not invent a mobile upload endpoint.',
  );
}

export function shareSheetSeam(): SeamResult {
  return seam('share_sheet', 'expo-sharing can wrap later. No CRM share actions in M06R.');
}

export function biometricUnlockSeam(): SeamResult {
  return seam(
    'biometrics',
    'expo-local-authentication may gate an already-authenticated session later. It is not a server login.',
  );
}
