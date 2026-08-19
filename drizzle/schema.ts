import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, longtext, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Stable local subject identifier. Existing OAuth accounts remain readable during migration. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  /** 密码重设时递增，用于使此前签发的本地会话失效。 */
  sessionVersion: int("sessionVersion").default(0).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 仅保存验证码的哈希摘要，不保存可直接用于验证的明文验证码。
 */
export const emailVerifications = mysqlTable("email_verifications", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  purpose: mysqlEnum("purpose", ["register", "reset_password"]).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;

/**
 * 分类表
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * 标签表
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * 文章表
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: longtext("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: varchar("coverImage", { length: 500 }),
  authorId: int("authorId").notNull(),
  categoryId: int("categoryId"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * 文章-标签关联表（多对多）
 */
export const postTags = mysqlTable("post_tags", {
  postId: int("postId").notNull(),
  tagId: int("tagId").notNull(),
});

export type PostTag = typeof postTags.$inferSelect;
export type InsertPostTag = typeof postTags.$inferInsert;

/**
 * 评论表（支持嵌套回复）
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  parentCommentId: int("parentCommentId"), // 用于嵌套回复
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * 图片集表
 */
export const galleries = mysqlTable("galleries", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gallery = typeof galleries.$inferSelect;
export type InsertGallery = typeof galleries.$inferInsert;

/**
 * 图片表
 */
export const images = mysqlTable("images", {
  id: int("id").autoincrement().primaryKey(),
  galleryId: int("galleryId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;

/**
 * 站点单例设置。所有公开身份与首页展示字段都可由管理员维护；数组配置以 JSON 字符串持久化，
 * 并只通过受约束的 tRPC 输入写入，避免引入任意页面搭建器。
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").primaryKey().default(1),
  siteName: varchar("siteName", { length: 80 }).notNull(),
  siteSubtitle: varchar("siteSubtitle", { length: 120 }).notNull(),
  avatarSrc: varchar("avatarSrc", { length: 500 }).notNull(),
  avatarAlt: varchar("avatarAlt", { length: 255 }).notNull(),
  authorName: varchar("authorName", { length: 100 }).notNull(),
  authorLabel: varchar("authorLabel", { length: 120 }).notNull(),
  authorIntroduction: text("authorIntroduction").notNull(),
  authorInterests: text("authorInterests").notNull(),
  statusLabel: varchar("statusLabel", { length: 80 }).notNull(),
  statusText: text("statusText").notNull(),
  statusUpdatedLabel: varchar("statusUpdatedLabel", { length: 80 }).notNull(),
  githubLabel: varchar("githubLabel", { length: 40 }).notNull(),
  githubHandle: varchar("githubHandle", { length: 120 }).notNull(),
  githubHref: varchar("githubHref", { length: 500 }).notNull(),
  emailLabel: varchar("emailLabel", { length: 40 }).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  emailHref: varchar("emailHref", { length: 500 }).notNull(),
  homeOpeningTitle: text("homeOpeningTitle").notNull(),
  homeOpeningDescription: text("homeOpeningDescription").notNull(),
  quoteFallback: varchar("quoteFallback", { length: 500 }).notNull(),
  featuredPostIds: text("featuredPostIds").notNull(),
  backgroundWhitelist: text("backgroundWhitelist").notNull(),
  navigationOrder: text("navigationOrder").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

/**
 * 关系定义
 */
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  tags: many(postTags),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const galleriesRelations = relations(galleries, ({ many }) => ({
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  gallery: one(galleries, {
    fields: [images.galleryId],
    references: [galleries.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));
