import { readFile, stat } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { galleries, images } from "../drizzle/schema.ts";
import { storagePut } from "../server/storage.ts";

const inputPath = "/home/ubuntu/upload/IMG_0345.jpg";
const galleryId = 1;
const title = "小爱音箱 Play 播放控制";
const fileName = "IMG_0345.jpg";
const bytes = await readFile(inputPath);
const metadata = await stat(inputPath);
const sha256 = createHash("sha256").update(bytes).digest("hex");
const description = "用户授权的实际图片：小爱音箱 Play 播放控制界面。";

if (metadata.size === 0 || metadata.size > 30 * 1024 * 1024) {
  throw new Error("图片大小不在允许的 0–30MiB 范围内");
}
if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
  throw new Error("图片内容不是合法 JPEG，已拒绝上传");
}

const db = await getDb();
if (!db) throw new Error("数据库不可用，未执行上传");

const [gallery] = await db.select({ id: galleries.id, title: galleries.title })
  .from(galleries)
  .where(eq(galleries.id, galleryId))
  .limit(1);
if (!gallery) throw new Error(`目标图片集 #${galleryId} 不存在，未执行上传`);

const existing = await db.select({ id: images.id, url: images.url })
  .from(images)
  .where(and(eq(images.galleryId, galleryId), eq(images.title, title)))
  .limit(1);
if (existing[0]) {
  console.log(JSON.stringify({ status: "already-bound", gallery, image: existing[0], sha256 }, null, 2));
  process.exit(0);
}

const objectKey = `blog/1/images/${Date.now()}-${randomUUID()}-IMG_0345.jpg`;
const stored = await storagePut(objectKey, bytes, "image/jpeg");
if (!/^\/manus-storage\/blog\/1\/images\/[A-Za-z0-9._-]+$/.test(stored.url)) {
  throw new Error(`存储返回了不符合图片集受控路径要求的 URL：${stored.url}`);
}

const result = await db.insert(images).values({
  galleryId,
  url: stored.url,
  title,
  description,
  order: 0,
});

console.log(JSON.stringify({
  status: "uploaded-and-bound",
  gallery,
  imageId: Number(result[0].insertId),
  url: stored.url,
  key: stored.key,
  fileName,
  bytes: metadata.size,
  sha256,
}, null, 2));
process.exit(0);
