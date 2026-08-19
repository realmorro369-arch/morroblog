import { eq, desc, and, inArray, isNull, isNotNull, or, gte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertSiteSettings, users, posts, comments, tags, categories, postTags, galleries, images, emailVerifications, siteSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

type CommentTree = typeof comments.$inferSelect & { replies: CommentTree[] };

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: {
  openId: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(users).values({
    openId: input.openId,
    email: input.email,
    passwordHash: input.passwordHash,
    emailVerifiedAt: new Date(),
    name: input.name ?? null,
    loginMethod: "email-password",
    role: input.role ?? "user",
    lastSignedIn: new Date(),
  });
  return getUserByEmail(input.email);
}

export async function touchUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updatePasswordAndBumpSessionVersion(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select({ sessionVersion: users.sessionVersion }).from(users).where(eq(users.id, id)).limit(1);
  if (!current[0]) return undefined;
  await db.update(users).set({
    passwordHash,
    sessionVersion: current[0].sessionVersion + 1,
    lastSignedIn: new Date(),
  }).where(eq(users.id, id));
  return getUserById(id);
}

export async function promoteConfiguredInitialAdmin(email: string | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return;
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ role: "admin" }).where(and(
    eq(users.email, normalizedEmail),
    eq(users.loginMethod, "email-password"),
    isNotNull(users.emailVerifiedAt),
  ));
}

export async function createEmailVerification(input: { email: string; purpose: "register" | "reset_password"; codeHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(emailVerifications).values({
    email: input.email,
    purpose: input.purpose,
    codeHash: input.codeHash,
    expiresAt: input.expiresAt,
  });
}

export async function getLatestEmailVerification(email: string, purpose: "register" | "reset_password") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailVerifications)
    .where(and(eq(emailVerifications.email, email), eq(emailVerifications.purpose, purpose), isNull(emailVerifications.usedAt)))
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);
  return result[0];
}

export async function countRecentEmailVerifications(email: string, purpose: "register" | "reset_password", since: Date) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(emailVerifications)
    .where(and(eq(emailVerifications.email, email), eq(emailVerifications.purpose, purpose), gte(emailVerifications.createdAt, since)));
  return result.length;
}

export async function incrementEmailVerificationAttempts(id: number) {
  const db = await getDb();
  if (!db) return;
  const record = await db.select({ attempts: emailVerifications.attempts }).from(emailVerifications).where(eq(emailVerifications.id, id)).limit(1);
  if (!record[0]) return;
  await db.update(emailVerifications).set({ attempts: record[0].attempts + 1 }).where(eq(emailVerifications.id, id));
}

export async function markEmailVerificationUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailVerifications).set({ usedAt: new Date() }).where(eq(emailVerifications.id, id));
}

export async function getAllUsers(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(users).orderBy(desc(users.lastSignedIn)).limit(limit).offset(offset);
  return result.map(({ passwordHash: _passwordHash, ...user }) => user);
}

// ============ 文章相关查询 ============

export type PublishedPostFilters = {
  tagSlug?: string;
  categoryId?: number;
  search?: string;
};

export async function getPublishedPosts(limit: number = 10, offset: number = 0, filters: PublishedPostFilters = {}) {
  const db = await getDb();
  if (!db) return [];

  if (filters.tagSlug) {
    const conditions = [eq(tags.slug, filters.tagSlug), eq(posts.status, 'published')];
    if (filters.categoryId) conditions.push(eq(posts.categoryId, filters.categoryId));
    if (filters.search) conditions.push(or(like(posts.title, `%${filters.search}%`), like(posts.excerpt, `%${filters.search}%`))!);
    const rows = await db
      .select({ post: posts })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);
    return rows.map((row) => row.post);
  }

  const conditions = [eq(posts.status, 'published')];
  if (filters.categoryId) conditions.push(eq(posts.categoryId, filters.categoryId));
  if (filters.search) conditions.push(or(like(posts.title, `%${filters.search}%`), like(posts.excerpt, `%${filters.search}%`))!);
  
  return db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 获取文章详情及其真实分类、标签关系。
 * 关联查询与主表查询分离，避免多标签 join 造成文章行重复。
 */
export async function getPostDetailBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  const post = result[0];
  if (!post) return undefined;

  const [category, tagRows, authorRows] = await Promise.all([
    post.categoryId ? getCategoryById(post.categoryId) : Promise.resolve(undefined),
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, description: tags.description })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, post.authorId)).limit(1),
  ]);

  return { ...post, category, tags: tagRows, author: authorRows[0] ?? null };
}

export async function getPostDetailById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const post = result[0];
  if (!post) return undefined;

  const [category, tagRows, authorRows] = await Promise.all([
    post.categoryId ? getCategoryById(post.categoryId) : Promise.resolve(undefined),
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, description: tags.description })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, post.authorId)).limit(1),
  ]);

  return { ...post, category, tags: tagRows, author: authorRows[0] ?? null };
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserPosts(userId: number, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(posts)
    .where(eq(posts.authorId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAdminPosts(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).orderBy(desc(posts.updatedAt)).limit(limit).offset(offset);
}

export async function getPostsByCategory(categoryId: number, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.categoryId, categoryId), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function incrementPostViewCount(postId: number) {
  const db = await getDb();
  if (!db) return;
  
  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length > 0) {
    await db.update(posts).set({ viewCount: (post[0].viewCount || 0) + 1 }).where(eq(posts.id, postId));
  }
}

export async function getPostCount(status: string = 'published', filters: PublishedPostFilters = {}) {
  const db = await getDb();
  if (!db) return 0;

  if (filters.tagSlug) {
    const conditions = [eq(tags.slug, filters.tagSlug), eq(posts.status, status as any)];
    if (filters.categoryId) conditions.push(eq(posts.categoryId, filters.categoryId));
    if (filters.search) conditions.push(or(like(posts.title, `%${filters.search}%`), like(posts.excerpt, `%${filters.search}%`))!);
    const result = await db
      .select({ id: posts.id })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(and(...conditions));
    return result.length;
  }

  const conditions = [eq(posts.status, status as any)];
  if (filters.categoryId) conditions.push(eq(posts.categoryId, filters.categoryId));
  if (filters.search) conditions.push(or(like(posts.title, `%${filters.search}%`), like(posts.excerpt, `%${filters.search}%`))!);
  
  const result = await db
    .select()
    .from(posts)
    .where(and(...conditions));
  
  return result.length;
}

// ============ 标签相关查询 ============

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tags).orderBy(tags.name);
}

export async function getTagBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPostsByTag(tagId: number, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({ post: posts })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(postTags.tagId, tagId), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * 基于已有标签关系推荐其他已发布文章。数据不足时返回空数组，绝不补造关联内容。
 */
export async function getRelatedPublishedPosts(postId: number, tagIds: number[], limit: number = 3) {
  const db = await getDb();
  if (!db || tagIds.length === 0) return [];

  const rows = await db
    .select({ post: posts })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(inArray(postTags.tagId, tagIds), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt));

  const related: typeof posts.$inferSelect[] = [];
  const seen = new Set<number>();
  for (const { post } of rows) {
    if (post.id === postId || seen.has(post.id)) continue;
    seen.add(post.id);
    related.push(post);
    if (related.length >= limit) break;
  }
  return related;
}

// ============ 分类相关查询 ============

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ 评论相关查询 ============

export async function getPostComments(postId: number, limit: number = 20, offset: number = 0, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];

  const visibility = viewerId
    ? or(eq(comments.status, 'approved'), and(eq(comments.status, 'pending'), eq(comments.authorId, viewerId)))
    : eq(comments.status, 'approved');
  
  return db
    .select()
    .from(comments)
    .where(and(eq(comments.postId, postId), visibility, isNull(comments.parentCommentId)))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getCommentReplies(parentCommentId: number, viewerId?: number): Promise<CommentTree[]> {
  const db = await getDb();
  if (!db) return [];

  return getCommentRepliesFromDb(db, parentCommentId, viewerId);
}

/** 供评论查询和单元测试复用的递归树组装逻辑。 */
export async function getCommentRepliesFromDb(db: any, parentCommentId: number, viewerId?: number): Promise<CommentTree[]> {

  const visibility = viewerId
    ? or(eq(comments.status, 'approved'), and(eq(comments.status, 'pending'), eq(comments.authorId, viewerId)))
    : eq(comments.status, 'approved');
  
  const replies = await db
    .select()
    .from(comments)
    .where(and(eq(comments.parentCommentId, parentCommentId), visibility))
    .orderBy(comments.createdAt) as Array<typeof comments.$inferSelect>;

  return Promise.all(
    replies.map(async (reply) => ({
      ...reply,
      replies: await getCommentRepliesFromDb(db, reply.id, viewerId),
    }))
  );
}

export async function getPendingComments(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(comments)
    .where(eq(comments.status, 'pending'))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
}

/** 管理员按真实审核状态浏览评论；不拼装文章或用户的虚构上下文。 */
export async function getAdminComments(status: "pending" | "approved" | "rejected" | undefined, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const query = db.select().from(comments);
  if (status) {
    return query.where(eq(comments.status, status)).orderBy(desc(comments.createdAt)).limit(limit).offset(offset);
  }
  return query.orderBy(desc(comments.createdAt)).limit(limit).offset(offset);
}

export async function getCommentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ 图片集相关查询 ============

export async function getAllGalleries(limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const galleryRows = await db
    .select()
    .from(galleries)
    .orderBy(desc(galleries.createdAt))
    .limit(limit)
    .offset(offset);

  return Promise.all(galleryRows.map(async (gallery) => {
    const galleryImages = await db
      .select({ id: images.id, url: images.url })
      .from(images)
      .where(eq(images.galleryId, gallery.id))
      .orderBy(images.order)
      .limit(1);
    return { ...gallery, coverImage: galleryImages[0]?.url || null };
  }));
}

export async function getGalleryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(galleries).where(eq(galleries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGalleryImages(galleryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(images)
    .where(eq(images.galleryId, galleryId))
    .orderBy(images.order);
}

export async function getGalleryImageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return result[0];
}

export async function getSiteSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return result[0];
}

export async function upsertSiteSettings(input: Omit<InsertSiteSettings, "id" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(siteSettings).values({ id: 1, ...input }).onDuplicateKeyUpdate({ set: input });
  return getSiteSettings();
}
