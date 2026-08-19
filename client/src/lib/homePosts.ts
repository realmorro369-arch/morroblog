export function splitHomePosts<T>(posts: readonly T[]) {
  const [featured, ...latest] = posts;
  return { featured, latest };
}
