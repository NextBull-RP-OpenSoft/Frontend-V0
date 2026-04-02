import * as dummyData from '../dummyData';

export async function getNews(symbol: string) {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 600));
  return { data: dummyData.getNews(symbol) };
}
