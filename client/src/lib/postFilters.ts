export type PostIndexFilters = {
  search: string;
  tagSlug: string | null;
  categoryId: string | null;
};

function normalizePositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value) > 0 ? value : null;
}

export function parsePostIndexFilters(queryString: string): PostIndexFilters {
  const params = new URLSearchParams(queryString.replace(/^\?/, ""));
  const search = params.get("q")?.trim() || "";
  const tagSlug = params.get("tag")?.trim() || null;
  const categoryId = normalizePositiveInteger(params.get("category"));
  return { search, tagSlug, categoryId };
}

export function buildPostIndexLocation(filters: PostIndexFilters) {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  const tagSlug = filters.tagSlug?.trim();
  const categoryId = normalizePositiveInteger(filters.categoryId);
  if (search) params.set("q", search);
  if (tagSlug) params.set("tag", tagSlug);
  if (categoryId) params.set("category", categoryId);
  const queryString = params.toString();
  return queryString ? `/posts?${queryString}` : "/posts";
}
