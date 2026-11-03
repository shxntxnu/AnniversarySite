/**
 * Helper to ensure image paths work across relative subfolders and GitHub Pages deployments
 */

export function resolvePhotoUrl(path) {
  if (!path) {
    return './uploads/PXL_20260616_202304977.jpg';
  }

  // Keep remote URLs or base64 Data URLs untouched
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Convert absolute domain root paths (/uploads/...) to relative (./uploads/...)
  if (path.startsWith('/uploads/')) {
    return '.' + path;
  }

  if (path.startsWith('uploads/')) {
    return './' + path;
  }

  if (!path.startsWith('./')) {
    return './uploads/' + path;
  }

  return path;
}
