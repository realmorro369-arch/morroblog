export type MorroTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  lyricsUrl: string;
  coverUrl: string;
};

const baseUrl = "https://morro.asia/music/";

export const morroPlaylist: MorroTrack[] = [
  { id: "love-song", title: "Love Song", artist: "方大同", audioUrl: `${baseUrl}Love%20Song%20fang.mp3`, lyricsUrl: `${baseUrl}Love%20Song%20fang.lrc`, coverUrl: "/manus-storage/love-song_580291b0.jpg" },
  { id: "hongchenkezhan", title: "红尘客栈", artist: "周杰伦", audioUrl: `${baseUrl}%E7%BA%A2%E5%B0%98%E5%AE%A2%E6%A0%88.mp3`, lyricsUrl: `${baseUrl}%E7%BA%A2%E5%B0%98%E5%AE%A2%E6%A0%88.lrc`, coverUrl: "/manus-storage/hongchenkezhan_f5b20652.jpg" },
  { id: "huahai", title: "花海", artist: "周杰伦", audioUrl: `${baseUrl}%E8%8A%B1%E6%B5%B7.mp3`, lyricsUrl: `${baseUrl}%E8%8A%B1%E6%B5%B7.lrc`, coverUrl: "/manus-storage/huahai_af80217b.jpg" },
  { id: "sanrenyou", title: "三人游", artist: "方大同", audioUrl: `${baseUrl}%E4%B8%89%E4%BA%BA%E6%B8%B8.mp3`, lyricsUrl: `${baseUrl}%E4%B8%89%E4%BA%BA%E6%B8%B8.lrc`, coverUrl: "/manus-storage/sanrenyou_f3ce89c0.jpg" },
  { id: "taoyanhongloumeng", title: "讨厌红楼梦", artist: "陶喆", audioUrl: `${baseUrl}%E8%AE%A8%E5%8E%8C%E7%BA%A2%E6%A5%BC%E6%A2%A6.mp3`, lyricsUrl: `${baseUrl}%E8%AE%A8%E5%8E%8C%E7%BA%A2%E6%A5%BC%E6%A2%A6.lrc`, coverUrl: "/manus-storage/taoyanhongloumeng_44606fec.jpg" },
  { id: "yanhua-yileng", title: "烟花易冷", artist: "周杰伦", audioUrl: `${baseUrl}%E7%83%9F%E8%8A%B1%E6%98%93%E5%86%B7.mp3`, lyricsUrl: `${baseUrl}%E7%83%9F%E8%8A%B1%E6%98%93%E5%86%B7.lrc`, coverUrl: "/manus-storage/yanhua-yileng_512e9c25.jpg" },
  { id: "faruxue", title: "发如雪", artist: "周杰伦", audioUrl: `${baseUrl}%E5%91%A8%E6%9D%B0%E4%BC%A6-%E5%8F%91%E5%A6%82%E9%9B%AA.flac`, lyricsUrl: `${baseUrl}%E5%91%A8%E6%9D%B0%E4%BC%A6-%E5%8F%91%E5%A6%82%E9%9B%AA.lrc`, coverUrl: "/manus-storage/faruxue_31157853.jpg" },
];

export const getAdjacentTrackIndex = (currentIndex: number, direction: 1 | -1) =>
  (currentIndex + direction + morroPlaylist.length) % morroPlaylist.length;
