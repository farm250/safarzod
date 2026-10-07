export interface Vibe {
  id: string;
  created_at: string;
  author: string;
  content: string;
  tag: string;
  likes: number;
}

export type NewVibe = Omit<Vibe, 'id' | 'created_at' | 'likes'>;
