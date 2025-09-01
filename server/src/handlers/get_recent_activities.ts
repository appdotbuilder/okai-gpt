import { db } from '../db';
import { 
  documentAnalysisTable, 
  generatedImagesTable, 
  generatedVideosTable, 
  quizTable, 
  webSearchTable 
} from '../db/schema';
import { type DocumentAnalysis, type GeneratedImage, type GeneratedVideo, type Quiz, type WebSearch } from '../schema';
import { desc } from 'drizzle-orm';

// Union type for all activities
export type RecentActivity = 
  | { type: 'document_analysis'; data: DocumentAnalysis }
  | { type: 'generated_image'; data: GeneratedImage }
  | { type: 'generated_video'; data: GeneratedVideo }
  | { type: 'quiz'; data: Quiz }
  | { type: 'web_search'; data: WebSearch };

export async function getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  try {
    // Fetch from all activity tables
    const [documentAnalyses, generatedImages, generatedVideos, quizzes, webSearches] = await Promise.all([
      db.select()
        .from(documentAnalysisTable)
        .orderBy(desc(documentAnalysisTable.created_at))
        .limit(limit)
        .execute(),

      db.select()
        .from(generatedImagesTable)
        .orderBy(desc(generatedImagesTable.created_at))
        .limit(limit)
        .execute(),

      db.select()
        .from(generatedVideosTable)
        .orderBy(desc(generatedVideosTable.created_at))
        .limit(limit)
        .execute(),

      db.select()
        .from(quizTable)
        .orderBy(desc(quizTable.created_at))
        .limit(limit)
        .execute(),

      db.select()
        .from(webSearchTable)
        .orderBy(desc(webSearchTable.created_at))
        .limit(limit)
        .execute()
    ]);

    // Combine all activities with their types
    const allActivities: RecentActivity[] = [
      ...documentAnalyses.map(data => ({ type: 'document_analysis' as const, data: data as DocumentAnalysis })),
      ...generatedImages.map(data => ({ type: 'generated_image' as const, data: data as GeneratedImage })),
      ...generatedVideos.map(data => ({ type: 'generated_video' as const, data: data as GeneratedVideo })),
      ...quizzes.map(data => ({ type: 'quiz' as const, data: data as Quiz })),
      ...webSearches.map(data => ({ type: 'web_search' as const, data: data as WebSearch }))
    ];

    // Sort all activities by creation date descending
    const sortedActivities = allActivities.sort((a, b) => {
      const dateA = new Date(a.data.created_at).getTime();
      const dateB = new Date(b.data.created_at).getTime();
      return dateB - dateA; // Descending order
    });

    // Apply final limit
    return sortedActivities.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
    throw error;
  }
}