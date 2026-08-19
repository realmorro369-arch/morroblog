import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { posts, comments, tags, categories, postTags, galleries, images, InsertPost, InsertComment, InsertTag, InsertCategory, InsertImage, InsertGallery } from "../drizzle/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { storagePut } from "./storage";
import { LocalAuthError, loginWithEmail, registerWithEmail, requestPasswordResetCode, requestRegistrationCode, resetPasswordWithEmail } from "./localAuth";
import { getHitokotoQuote } from "./hitokoto";

function safeUser<T extends { passwordHash?: string | null } | null>(user: T) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

function authError(error: unknown): never {
  if (error instanceof LocalAuthError) throw new TRPCError({ code: error.code, message: error.message });
  console.error("[LocalAuth] Unexpected error", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "认证服务暂时不可用" });
}

const IMAGE_SIGNATURES: Record<string, (bytes: Buffer) => boolean> = {
  "image/jpeg": (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/gif": (bytes) => bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii")),
  "image/webp": (bytes) => bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP",
  "image/avif": (bytes) => bytes.length >= 16 && bytes.subarray(4, 8).toString("ascii") === "ftyp" && ["avif", "avis"].includes(bytes.subarray(8, 12).toString("ascii")),
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const galleryTitleInput = z.string().trim().min(1, "图片集标题不能为空").max(255, "图片集标题不能超过 255 个字符");
const galleryDescriptionInput = z.string().trim().max(2000, "图片集说明不能超过 2000 个字符").optional();
const internalGalleryImageUrl = z.string().trim().max(500, "图片地址不能超过 500 个字符").refine(
  (value) => /^\/manus-storage\/blog\/\d+\/images\/[A-Za-z0-9._-]+$/.test(value),
  "图片必须来自站内受控存储",
);

const siteSettingsInput = z.object({
  siteName: z.string().trim().min(1).max(80),
  siteSubtitle: z.string().trim().min(1).max(120),
  avatarSrc: z.string().trim().min(1).max(500),
  avatarAlt: z.string().trim().min(1).max(255),
  authorName: z.string().trim().min(1).max(100),
  authorLabel: z.string().trim().min(1).max(120),
  authorIntroduction: z.string().trim().min(1).max(2000),
  authorInterests: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
  statusLabel: z.string().trim().min(1).max(80),
  statusText: z.string().trim().min(1).max(1000),
  statusUpdatedLabel: z.string().trim().min(1).max(80),
  githubLabel: z.string().trim().min(1).max(40),
  githubHandle: z.string().trim().min(1).max(120),
  githubHref: z.string().url().max(500),
  emailLabel: z.string().trim().min(1).max(40),
  emailAddress: z.string().trim().email().max(320),
  emailHref: z.string().trim().regex(/^mailto:/).max(500),
  homeOpeningTitle: z.string().trim().min(1).max(500),
  homeOpeningDescription: z.string().trim().min(1).max(2000),
  quoteFallback: z.string().trim().min(1).max(500),
  featuredPostIds: z.array(z.number().int().positive()).max(12),
  backgroundWhitelist: z.array(z.string().trim().regex(/^\/manus-storage\//).max(500)).max(12),
  navigationOrder: z.array(z.enum(["home", "posts", "timeline", "archives", "tags", "gallery", "about"])).min(1).max(7),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => safeUser(opts.ctx.user)),
    requestRegistrationCode: publicProcedure
      .input(z.object({ email: z.string().trim().email() }))
      .mutation(async ({ input }) => {
        try {
          return await requestRegistrationCode(input.email);
        } catch (error) {
          return authError(error);
        }
      }),
    requestPasswordResetCode: publicProcedure
      .input(z.object({ email: z.string().trim().email() }))
      .mutation(async ({ input }) => {
        try {
          return await requestPasswordResetCode(input.email);
        } catch (error) {
          return authError(error);
        }
      }),
    register: publicProcedure
      .input(z.object({
        email: z.string().trim().email(),
        code: z.string().trim().regex(/^\d{6}$/),
        password: z.string().min(10).max(72),
        name: z.string().trim().min(1).max(80).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await registerWithEmail(input);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, result.token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
          return { user: safeUser(result.user) };
        } catch (error) {
          return authError(error);
        }
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().email(), password: z.string().min(1).max(72) }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await loginWithEmail(input.email, input.password);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, result.token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
          return { user: safeUser(result.user) };
        } catch (error) {
          return authError(error);
        }
      }),
    resetPassword: publicProcedure
      .input(z.object({
        email: z.string().trim().email(),
        code: z.string().trim().regex(/^\d{6}$/),
        password: z.string().min(10).max(72),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await resetPasswordWithEmail(input);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, result.token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
          return { user: safeUser(result.user) };
        } catch (error) {
          return authError(error);
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  quote: router({
    current: publicProcedure.query(() => getHitokotoQuote()),
  }),

  site: router({
    settings: publicProcedure.query(() => db.getSiteSettings()),
  }),

  // ============ 文章路由 ============
  posts: router({
    list: publicProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        tagSlug: z.string().min(1).optional(),
        categoryId: z.number().int().positive().optional(),
        search: z.string().trim().min(1).max(120).optional(),
      }))
      .query(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;
        const filters = { tagSlug: input.tagSlug, categoryId: input.categoryId, search: input.search };
        const [posts_data, total] = await Promise.all([
          db.getPublishedPosts(input.limit, offset, filters),
          db.getPostCount('published', filters),
        ]);
        return {
          data: posts_data,
          total,
          page: input.page,
          limit: input.limit,
        };
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await db.getPostDetailBySlug(input.slug);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "文章不存在" });
        }
        // 增加阅读量
        await db.incrementPostViewCount(post.id);
        return post;
      }),

    related: publicProcedure
      .input(z.object({
        postId: z.number().int().positive(),
        tagIds: z.array(z.number().int().positive()).max(20),
        limit: z.number().int().min(1).max(6).default(3),
      }))
      .query(({ input }) => db.getRelatedPublishedPosts(input.postId, input.tagIds, input.limit)),

    getForEdit: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const post = await db.getPostDetailById(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "文章不存在" });
        if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权编辑此文章" });
        }
        return post;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        tagIds: z.array(z.number().int().positive()).default([]),
        status: z.enum(['draft', 'published', 'archived']).default('draft'),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        if (input.categoryId) {
          const category = await db.getCategoryById(input.categoryId);
          if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "所选分类不存在" });
        }

        const tagIds = Array.from(new Set(input.tagIds));
        if (tagIds.length > 0) {
          const validTags = await dbInstance.select({ id: tags.id }).from(tags).where(inArray(tags.id, tagIds));
          if (validTags.length !== tagIds.length) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "所选标签不存在" });
          }
        }

        const newPost: InsertPost = {
          title: input.title,
          slug: input.slug,
          content: input.content,
          excerpt: input.excerpt,
          coverImage: input.coverImage,
          categoryId: input.categoryId,
          status: input.status,
          authorId: ctx.user.id,
          publishedAt: input.status === 'published' ? new Date() : null,
        };

        const result = await dbInstance.insert(posts).values(newPost);
        const postId = Number(result[0].insertId);
        if (tagIds.length > 0) {
          await dbInstance.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
        }
        return { id: postId, ...newPost, tagIds };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().min(1).optional(),
        content: z.string().optional(),
        excerpt: z.string().nullable().optional(),
        coverImage: z.string().nullable().optional(),
        categoryId: z.number().nullable().optional(),
        tagIds: z.array(z.number().int().positive()).optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const post = await db.getPostById(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        if (post.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权修改此文章" });
        }

        if (input.categoryId !== undefined && input.categoryId !== null) {
          const category = await db.getCategoryById(input.categoryId);
          if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "所选分类不存在" });
        }

        const tagIds = input.tagIds ? Array.from(new Set(input.tagIds)) : undefined;
        if (tagIds && tagIds.length > 0) {
          const validTags = await dbInstance.select({ id: tags.id }).from(tags).where(inArray(tags.id, tagIds));
          if (validTags.length !== tagIds.length) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "所选标签不存在" });
          }
        }

        const updateData: any = { ...input };
        delete updateData.id;
        delete updateData.tagIds;
        if (input.status === 'published' && post.status !== 'published') {
          updateData.publishedAt = new Date();
        }

        await dbInstance.update(posts).set(updateData).where(eq(posts.id, input.id));
        if (tagIds) {
          await dbInstance.delete(postTags).where(eq(postTags.postId, input.id));
          if (tagIds.length > 0) {
            await dbInstance.insert(postTags).values(tagIds.map((tagId) => ({ postId: input.id, tagId })));
          }
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const post = await db.getPostById(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        if (post.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await dbInstance.delete(posts).where(eq(posts.id, input.id));
        return { success: true };
      }),

    myPosts: protectedProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      }))
      .query(async ({ input, ctx }) => {
        const offset = (input.page - 1) * input.limit;
        const posts_data = await db.getUserPosts(ctx.user.id, input.limit, offset);
        return { data: posts_data, page: input.page };
      }),
  }),

  // ============ 标签路由 ============
  tags: router({
    list: publicProcedure.query(() => db.getAllTags()),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const newTag: InsertTag = input;
        const result = await dbInstance.insert(tags).values(newTag);
        return { id: result[0].insertId, ...newTag };
      }),
  }),

  // ============ 分类路由 ============
  categories: router({
    list: publicProcedure.query(() => db.getAllCategories()),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const newCategory: InsertCategory = input;
        const result = await dbInstance.insert(categories).values(newCategory);
        return { id: result[0].insertId, ...newCategory };
      }),
  }),

  // ============ 评论路由 ============
  comments: router({
    list: publicProcedure
      .input(z.object({
        postId: z.number(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input, ctx }) => {
        const offset = (input.page - 1) * input.limit;
        const viewerId = ctx.user?.id;
        const comments_data = await db.getPostComments(input.postId, input.limit, offset, viewerId);
        
        // 获取每条评论的回复
        const commentsWithReplies = await Promise.all(
          comments_data.map(async (comment) => {
            const replies = await db.getCommentReplies(comment.id, viewerId);
            return { ...comment, replies };
          })
        );

        return { data: commentsWithReplies, page: input.page };
      }),

    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().trim().min(1, "评论不能为空").max(2000, "评论不能超过 2000 个字符"),
        parentCommentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        if (input.parentCommentId) {
          const parentComment = await db.getCommentById(input.parentCommentId);
          if (!parentComment || parentComment.postId !== input.postId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "回复的目标评论不存在或不属于这篇文章" });
          }
        }

        const newComment: InsertComment = {
          ...input,
          authorId: ctx.user.id,
          status: 'pending', // 新评论需要审核
        };

        const result = await dbInstance.insert(comments).values(newComment);
        return { id: result[0].insertId, ...newComment };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const comment = await db.getCommentById(input.id);
        if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
        if (comment.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await dbInstance.delete(comments).where(eq(comments.id, input.id));
        return { success: true };
      }),
  }),

  // ============ 图片存储路由 ============
  media: router({
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string().min(1).max(128),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]),
        base64: z.string().min(1).max(42_000_000),
      }))
      .mutation(async ({ input, ctx }) => {
        const normalizedBase64 = input.base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64) || normalizedBase64.length % 4 !== 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "图片编码无效" });
        }
        const bytes = Buffer.from(normalizedBase64, "base64");
        const maxBytes = 30 * 1024 * 1024;
        if (bytes.length === 0 || bytes.length > maxBytes) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "图片不得超过 30MB" });
        }

        if (!IMAGE_SIGNATURES[input.mimeType](bytes)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "图片内容与声明的格式不匹配" });
        }

        const sanitizedStem = input.fileName
          .replace(/[^a-zA-Z0-9._-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/\.[^.]+$/, "")
          .slice(0, 80) || "image";
        const objectKey = `blog/${ctx.user.id}/images/${Date.now()}-${crypto.randomUUID()}-${sanitizedStem}.${IMAGE_EXTENSIONS[input.mimeType]}`;
        const { key, url } = await storagePut(objectKey, bytes, input.mimeType);
        return { key, url };
      }),
  }),

  // ============ 管理员路由 ============
  admin: router({
    siteSettings: router({
      get: adminProcedure.query(() => db.getSiteSettings()),
      save: adminProcedure
        .input(siteSettingsInput)
        .mutation(async ({ input }) => {
          const uniqueFeaturedPostIds = Array.from(new Set(input.featuredPostIds));
          if (uniqueFeaturedPostIds.length > 0) {
            const dbInstance = await getDb();
            if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const existingPublishedPosts = await dbInstance.select({ id: posts.id }).from(posts).where(and(
              inArray(posts.id, uniqueFeaturedPostIds),
              eq(posts.status, "published"),
            ));
            if (existingPublishedPosts.length !== uniqueFeaturedPostIds.length) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "精选文章必须是已发布的真实文章" });
            }
          }
          return db.upsertSiteSettings({
            ...input,
            featuredPostIds: JSON.stringify(uniqueFeaturedPostIds),
            authorInterests: JSON.stringify(input.authorInterests),
            backgroundWhitelist: JSON.stringify(input.backgroundWhitelist),
            navigationOrder: JSON.stringify(input.navigationOrder),
          });
        }),
    }),
    posts: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }))
        .query(async ({ input }) => db.getAdminPosts(input.limit, (input.page - 1) * input.limit)),
    }),
    users: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }))
        .query(async ({ input }) => db.getAllUsers(input.limit, (input.page - 1) * input.limit)),
    }),
    comments: router({
      list: adminProcedure
        .input(z.object({
          page: z.number().default(1),
          limit: z.number().default(50),
          status: z.enum(["all", "pending", "approved", "rejected"]).default("pending"),
        }))
        .query(async ({ input }) => db.getAdminComments(
          input.status === "all" ? undefined : input.status,
          input.limit,
          (input.page - 1) * input.limit,
        )),

      pending: adminProcedure
        .input(z.object({
          page: z.number().default(1),
          limit: z.number().default(20),
        }))
        .query(async ({ input }) => {
          const offset = (input.page - 1) * input.limit;
          return db.getPendingComments(input.limit, offset);
        }),

      approve: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const dbInstance = await getDb();
          if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          await dbInstance.update(comments).set({ status: 'approved' }).where(eq(comments.id, input.id));
          return { success: true };
        }),

      reject: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const dbInstance = await getDb();
          if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          await dbInstance.update(comments).set({ status: 'rejected' }).where(eq(comments.id, input.id));
          return { success: true };
        }),

      setStatus: adminProcedure
        .input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "approved", "rejected"]) }))
        .mutation(async ({ input }) => {
          const dbInstance = await getDb();
          if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          const comment = await db.getCommentById(input.id);
          if (!comment) throw new TRPCError({ code: "NOT_FOUND", message: "评论不存在" });
          await dbInstance.update(comments).set({ status: input.status }).where(eq(comments.id, input.id));
          return { success: true, status: input.status };
        }),
    }),
  }),

  // ============ 图片集路由 ============
  galleries: router({
    list: publicProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;
        return db.getAllGalleries(input.limit, offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const gallery = await db.getGalleryById(input.id);
        if (!gallery) throw new TRPCError({ code: "NOT_FOUND" });

        const gallery_images = await db.getGalleryImages(input.id);
        return { ...gallery, images: gallery_images };
      }),

    create: adminProcedure
      .input(z.object({
        title: galleryTitleInput,
        description: galleryDescriptionInput,
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const newGallery: InsertGallery = input;
        const result = await dbInstance.insert(galleries).values(newGallery);
        return { id: result[0].insertId, ...newGallery };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: galleryTitleInput,
        description: galleryDescriptionInput,
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const gallery = await db.getGalleryById(input.id);
        if (!gallery) throw new TRPCError({ code: "NOT_FOUND" });
        await dbInstance.update(galleries).set({
          title: input.title,
          description: input.description?.trim() || null,
        }).where(eq(galleries.id, input.id));
        return { success: true };
      }),

    addImage: adminProcedure
      .input(z.object({
        galleryId: z.number().int().positive(),
        url: internalGalleryImageUrl,
        title: z.string().trim().min(1, "图片标题不能为空").max(255, "图片标题不能超过 255 个字符").optional(),
        description: z.string().trim().max(2000, "图片说明不能超过 2000 个字符").optional(),
        order: z.number().int().min(0).max(10000).default(0),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const gallery = await db.getGalleryById(input.galleryId);
        if (!gallery) throw new TRPCError({ code: "NOT_FOUND", message: "图片集不存在" });

        const newImage: InsertImage = {
          ...input,
          title: input.title || null,
          description: input.description || null,
        };
        const result = await dbInstance.insert(images).values(newImage);
        return { id: result[0].insertId, ...newImage };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const gallery = await db.getGalleryById(input.id);
        if (!gallery) throw new TRPCError({ code: "NOT_FOUND" });
        await dbInstance.delete(images).where(eq(images.galleryId, input.id));
        await dbInstance.delete(galleries).where(eq(galleries.id, input.id));
        return { success: true };
      }),

    removeImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const image = await db.getGalleryImageById(input.id);
        if (!image) throw new TRPCError({ code: "NOT_FOUND" });
        await dbInstance.delete(images).where(eq(images.id, input.id));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
