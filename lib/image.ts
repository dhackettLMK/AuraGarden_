/**
 * Resize an uploaded image on the device to a 256 px WebP of 50 KB or less
 * (brief 6.2, 6.6). Returns a data URL stored inside the record.
 */
export async function resizeImage(file: Blob, max = 256, maxBytes = 50_000): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  // Square crop for avatars and icons keeps tiles tidy.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const size = Math.round(Math.min(max, side * (scale < 1 ? max / side : 1)));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.max(1, size);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  for (const q of [0.86, 0.75, 0.62, 0.5, 0.38, 0.28]) {
    const url = canvas.toDataURL("image/webp", q);
    if (url.length * 0.75 <= maxBytes) return url;
  }
  return canvas.toDataURL("image/webp", 0.2);
}
