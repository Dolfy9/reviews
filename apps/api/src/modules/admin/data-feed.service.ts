import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../config/prisma.service";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { EmbeddingService } from "../search/embedding.service";

export interface MiningProgressEvent {
  step:
    | "start"
    | "fetching"
    | "fetched"
    | "inserting"
    | "product_inserted"
    | "source_done"
    | "source_error"
    | "complete";
  source?: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/* ---------- Types ---------- */

interface NormalizedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  parentCategory: string;
  images: string[];
  source: string;
  averageRating: number;
  reviewCount: number;
  metadata: Record<string, unknown>;
}

export interface SourceResult {
  source: string;
  fetched: number;
  inserted: number;
  skipped: number;
}

export type SourceId =
  | "off"
  | "itunes_movies"
  | "itunes_podcasts"
  | "itunes_apps"
  | "openlibrary"
  | "all";

export const SOURCE_LABELS: Record<SourceId, string> = {
  off: "Open Food Facts",
  itunes_movies: "iTunes Movies",
  itunes_podcasts: "iTunes Podcasts",
  itunes_apps: "iTunes Apps",
  openlibrary: "Open Library",
  all: "All Sources",
};

/* ---------- Helpers ---------- */

function roundPrice(n: number): number {
  return Math.max(0.49, Math.round(n * 100) / 100);
}

function randomPrice(min: number, max: number): number {
  return roundPrice(min + Math.random() * (max - min));
}

function randomPage(maxPage: number): number {
  return Math.floor(Math.random() * maxPage) + 1;
}

const ITUNES_MOVIE_TERMS = [
  "action",
  "comedy",
  "drama",
  "horror",
  "sci-fi",
  "romance",
  "thriller",
  "documentary",
  "animation",
  "adventure",
  "fantasy",
  "mystery",
  "crime",
  "family",
  "history",
  "war",
  "music",
  "western",
  "biography",
  "sport",
];

const ITUNES_PODCAST_TERMS = [
  "technology",
  "business",
  "health",
  "science",
  "history",
  "comedy",
  "news",
  "education",
  "true crime",
  "sports",
  "politics",
  "culture",
  "gaming",
  "design",
  "marketing",
  "finance",
  "psychology",
  "travel",
  "food",
  "literature",
];

const ITUNES_APP_TERMS = [
  "games",
  "social",
  "photo",
  "fitness",
  "music",
  "finance",
  "education",
  "travel",
  "shopping",
  "news",
  "weather",
  "productivity",
  "health",
  "entertainment",
  "lifestyle",
  "navigation",
  "reference",
  "utilities",
  "business",
  "sports",
];

const OPENLIBRARY_TERMS = [
  "fiction",
  "history",
  "science",
  "mystery",
  "romance",
  "fantasy",
  "biography",
  "poetry",
  "adventure",
  "philosophy",
  "psychology",
  "cooking",
  "travel",
  "art",
  "music",
  "business",
  "technology",
  "nature",
  "space",
  "war",
];

function randomTerm<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function nutriScoreToRating(grade: string | undefined): number {
  if (!grade) return 0;
  const map: Record<string, number> = { a: 5, b: 4, c: 3, d: 2, e: 1 };
  return map[grade.toLowerCase()] ?? 0;
}

function clampRating(n: number | undefined): number {
  if (!n || n < 0) return 0;
  return Math.min(5, Math.round(n * 10) / 10);
}

/* ---------- Review generation ---------- */

const REVIEW_TITLES_POSITIVE = [
  "Excellent product",
  "Highly recommend",
  "Great value for money",
  "Fantastic quality",
  "Love this!",
  "Best purchase this year",
  "Exceeded expectations",
  "Will buy again",
  "Five stars well deserved",
  "Impressed!",
];

const REVIEW_TITLES_NEUTRAL = [
  "Decent, but could be better",
  "It's okay",
  "Mixed feelings",
  "Not bad, not great",
  "Average experience",
  "Does the job",
  "Fair for the price",
  "Could be improved",
];

const REVIEW_TITLES_NEGATIVE = [
  "Disappointed",
  "Not worth it",
  "Would not recommend",
  "Expected more",
  "Regret buying",
  "Poor quality",
];

const REVIEW_CONTENTS_POSITIVE = [
  "I've been using this for a few weeks now and I'm thoroughly impressed. The quality is outstanding and it works exactly as described.",
  "This exceeded all my expectations. The build quality is solid and it feels premium. Definitely worth every penny.",
  "Amazing product! I was skeptical at first but after trying it out I can confidently say it's one of the best purchases I've made.",
  "Perfect! Exactly what I needed. Fast delivery and the product works flawlessly. Highly recommend to anyone considering it.",
  "I bought this on a whim and I'm so glad I did. It's well-designed, practical, and has made my daily routine much easier.",
];

const REVIEW_CONTENTS_NEUTRAL = [
  "It's a decent product. Nothing extraordinary but it gets the job done. I think the price could be a bit lower for what you get.",
  "Works as expected but nothing special. I've seen better alternatives in the same price range. It's an average product overall.",
  "I have mixed feelings about this. Some features are great, others feel lacking. It's an okay product if you're not too demanding.",
  "It does what it says but the quality could be better. I'll keep using it for now but might look for alternatives later.",
];

const REVIEW_CONTENTS_NEGATIVE = [
  "Unfortunately this didn't live up to the hype. The quality feels cheap and it stopped working properly after a short time.",
  "I really wanted to like this but it's overpriced for what you get. There are much better options out there for less money.",
  "Disappointed with this purchase. The product arrived with issues and customer service wasn't helpful. Would not buy again.",
];

const SEED_USERS = [
  { email: "alice@example.com", name: "Alice" },
  { email: "bob@example.com", name: "Bob" },
  { email: "joe@example.com", name: "Joe" },
  { email: "charlie@example.com", name: "Charlie" },
  { email: "dave@example.com", name: "Dave" },
  { email: "eve@example.com", name: "Eve" },
  { email: "frank@example.com", name: "Frank" },
  { email: "grace@example.com", name: "Grace" },
  { email: "heidi@example.com", name: "Heidi" },
  { email: "ivan@example.com", name: "Ivan" },
  { email: "judy@example.com", name: "Judy" },
  { email: "kevin@example.com", name: "Kevin" },
  { email: "laura@example.com", name: "Laura" },
];

function generateReviewsForProduct(
  productId: string,
  userIds: string[],
  minReviews: number,
  maxReviews: number,
): Array<{
  productId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
}> {
  const count =
    Math.floor(Math.random() * (maxReviews - minReviews + 1)) + minReviews;
  const reviews: Array<{
    productId: string;
    userId: string;
    rating: number;
    title: string;
    content: string;
  }> = [];
  const usedUserIds = new Set<string>();

  for (let i = 0; i < count && i < userIds.length; i++) {
    let userId = userIds[Math.floor(Math.random() * userIds.length)] ?? "";
    let attempts = 0;
    while (usedUserIds.has(userId) && attempts < userIds.length) {
      userId = userIds[Math.floor(Math.random() * userIds.length)] ?? "";
      attempts++;
    }
    if (usedUserIds.has(userId)) break;
    usedUserIds.add(userId);

    const roll = Math.random();
    let rating: number;
    let title: string;
    let content: string;

    if (roll < 0.55) {
      rating = Math.floor(Math.random() * 2) + 4;
      title = randomTerm(REVIEW_TITLES_POSITIVE);
      content = randomTerm(REVIEW_CONTENTS_POSITIVE);
    } else if (roll < 0.8) {
      rating = 3;
      title = randomTerm(REVIEW_TITLES_NEUTRAL);
      content = randomTerm(REVIEW_CONTENTS_NEUTRAL);
    } else {
      rating = Math.floor(Math.random() * 2) + 1;
      title = randomTerm(REVIEW_TITLES_NEGATIVE);
      content = randomTerm(REVIEW_CONTENTS_NEGATIVE);
    }

    reviews.push({ productId, userId, rating, title, content });
  }

  return reviews;
}

/* ---------- Source fetchers ---------- */

async function fetchOpenFoodFacts(count: number): Promise<NormalizedProduct[]> {
  const pageSize = Math.min(count, 100);
  const page = randomPage(20);
  const url = `https://world.openfoodfacts.org/api/v2/search?fields=product_name,brands,categories,image_url,image_front_url,image_nutrition_url,image_ingredients_url,quantity,nutrition_grades,ingredients_text,allergens,nutriments,countries,stores,labels,code&page_size=${pageSize}&page=${page}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ReviewHub/1.0 (product reviews platform; data feed)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`OFF API returned ${res.status}`);
  const data = (await res.json()) as {
    products: Array<Record<string, string | undefined>>;
  };
  return (data.products ?? [])
    .filter((p) => p.product_name && p.product_name.trim().length > 0)
    .map((p) => {
      const cats = (p.categories ?? "")
        .split(",")
        .map((c) => c.trim().toLowerCase());
      const category = cats.find((c) => c.length > 0) ?? "food";
      const parts: string[] = [];
      if (p.brands) parts.push(`Brand: ${p.brands}`);
      if (p.quantity) parts.push(`Size: ${p.quantity}`);
      if (p.nutrition_grades)
        parts.push(`Nutri-Score: ${p.nutrition_grades.toUpperCase()}`);
      const nutriRating = nutriScoreToRating(p.nutrition_grades);
      const images: string[] = [];
      if (p.image_url) images.push(p.image_url);
      if (p.image_front_url && p.image_front_url !== p.image_url)
        images.push(p.image_front_url);
      if (p.image_nutrition_url) images.push(p.image_nutrition_url);
      if (p.image_ingredients_url) images.push(p.image_ingredients_url);
      const metadata: Record<string, unknown> = {};
      if (p.brands) metadata["brand"] = p.brands;
      if (p.quantity) metadata["quantity"] = p.quantity;
      if (p.nutrition_grades)
        metadata["nutriScore"] = p.nutrition_grades.toUpperCase();
      if (p.ingredients_text)
        metadata["ingredients"] = p.ingredients_text.slice(0, 500);
      if (p.allergens) metadata["allergens"] = p.allergens;
      if (p.countries) metadata["countries"] = p.countries;
      if (p.stores) metadata["stores"] = p.stores;
      if (p.labels) metadata["labels"] = p.labels;
      if (p.code) metadata["barcode"] = p.code;
      if (p.nutriments) metadata["nutriments"] = p.nutriments;
      metadata["categories"] = cats;
      return {
        name: p.product_name!.trim(),
        description: parts.length
          ? parts.join(". ") + "."
          : "Food product from Open Food Facts.",
        price: randomPrice(1.5, 12),
        category,
        parentCategory: "Food",
        images,
        source: "off",
        averageRating: nutriRating,
        reviewCount: nutriRating > 0 ? Math.floor(Math.random() * 200) + 20 : 0,
        metadata,
      };
    });
}

function upscaleITunesImage(url: string | undefined): string[] {
  if (!url) return [];
  const images: string[] = [];
  images.push(url.replace(/100x100bb/, "600x600bb"));
  images.push(url.replace(/100x100bb/, "300x300bb"));
  return [...new Set(images)];
}

async function fetchITunesMovies(count: number): Promise<NormalizedProduct[]> {
  const limit = Math.min(count, 100);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm(ITUNES_MOVIE_TERMS))}&media=movie&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`iTunes Movies API returned ${res.status}`);
  const data = (await res.json()) as {
    results: Array<{
      trackName?: string;
      collectionName?: string;
      longDescription?: string;
      shortDescription?: string;
      collectionPrice?: number;
      trackPrice?: number;
      primaryGenreName?: string;
      artworkUrl100?: string;
      contentAdvisoryRating?: string;
      trackTimeMillis?: number;
      country?: string;
      releaseDate?: string;
      artistName?: string;
      collectionCensoredName?: string;
      trackViewUrl?: string;
    }>;
  };
  return (data.results ?? [])
    .filter((r) => (r.trackName ?? r.collectionName)?.trim().length)
    .map((r) => {
      const metadata: Record<string, unknown> = {};
      if (r.artistName) metadata["director"] = r.artistName;
      if (r.primaryGenreName) metadata["genre"] = r.primaryGenreName;
      if (r.contentAdvisoryRating)
        metadata["contentRating"] = r.contentAdvisoryRating;
      if (r.trackTimeMillis)
        metadata["runtime"] = `${Math.round(r.trackTimeMillis / 60000)} min`;
      if (r.releaseDate) metadata["releaseDate"] = r.releaseDate;
      if (r.country) metadata["country"] = r.country;
      if (r.trackViewUrl) metadata["iTunesUrl"] = r.trackViewUrl;
      return {
        name: (r.trackName ?? r.collectionName ?? "").trim(),
        description:
          r.longDescription?.trim() ||
          r.shortDescription?.trim() ||
          `${r.primaryGenreName ?? "Movie"} available on iTunes.`,
        price: roundPrice(r.trackPrice ?? r.collectionPrice ?? 9.99),
        category: (r.primaryGenreName ?? "movies").toLowerCase(),
        parentCategory: "Movies",
        images: upscaleITunesImage(r.artworkUrl100),
        source: "itunes_movies",
        averageRating: 0,
        reviewCount: 0,
        metadata,
      };
    });
}

async function fetchITunesPodcasts(
  count: number,
): Promise<NormalizedProduct[]> {
  const limit = Math.min(count, 100);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm(ITUNES_PODCAST_TERMS))}&media=podcast&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`iTunes Podcasts API returned ${res.status}`);
  const data = (await res.json()) as {
    results: Array<{
      collectionName?: string;
      trackName?: string;
      artistName?: string;
      primaryGenreName?: string;
      artworkUrl100?: string;
      feedUrl?: string;
      trackCount?: number;
      releaseDate?: string;
      country?: string;
      collectionViewUrl?: string;
    }>;
  };
  return (data.results ?? [])
    .filter((r) => (r.trackName ?? r.collectionName)?.trim().length)
    .map((r) => {
      const parts: string[] = [];
      if (r.artistName) parts.push(`By ${r.artistName}`);
      if (r.trackCount) parts.push(`${r.trackCount} episodes`);
      if (r.primaryGenreName) parts.push(`Genre: ${r.primaryGenreName}`);
      const metadata: Record<string, unknown> = {};
      if (r.artistName) metadata["author"] = r.artistName;
      if (r.primaryGenreName) metadata["genre"] = r.primaryGenreName;
      if (r.trackCount) metadata["episodeCount"] = r.trackCount;
      if (r.feedUrl) metadata["feedUrl"] = r.feedUrl;
      if (r.releaseDate) metadata["releaseDate"] = r.releaseDate;
      if (r.country) metadata["country"] = r.country;
      if (r.collectionViewUrl) metadata["iTunesUrl"] = r.collectionViewUrl;
      return {
        name: (r.trackName ?? r.collectionName ?? "").trim(),
        description: parts.length
          ? parts.join(". ") + "."
          : "Podcast from iTunes.",
        price: 0,
        category: (r.primaryGenreName ?? "podcasts").toLowerCase(),
        parentCategory: "Podcasts",
        images: upscaleITunesImage(r.artworkUrl100),
        source: "itunes_podcasts",
        averageRating: 0,
        reviewCount: 0,
        metadata,
      };
    });
}

async function fetchITunesApps(count: number): Promise<NormalizedProduct[]> {
  const limit = Math.min(count, 100);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm(ITUNES_APP_TERMS))}&media=software&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`iTunes Apps API returned ${res.status}`);
  const data = (await res.json()) as {
    results: Array<{
      trackName?: string;
      description?: string;
      price?: number;
      primaryGenreName?: string;
      artworkUrl100?: string;
      sellerName?: string;
      averageUserRating?: number;
      userRatingCount?: number;
      contentAdvisoryRating?: string;
      currentVersionReleaseDate?: string;
      version?: string;
      minimumOsVersion?: string;
      languages?: string[];
      fileSizeBytes?: number;
      trackViewUrl?: string;
      screenshotUrls?: string[];
      ipadScreenshotUrls?: string[];
    }>;
  };
  return (data.results ?? [])
    .filter((r) => r.trackName?.trim().length)
    .map((r) => {
      const parts: string[] = [];
      if (r.sellerName) parts.push(`Developer: ${r.sellerName}`);
      if (r.primaryGenreName) parts.push(`Category: ${r.primaryGenreName}`);
      if (r.averageUserRating)
        parts.push(`Rating: ${r.averageUserRating.toFixed(1)}/5`);
      if (r.userRatingCount) parts.push(`${r.userRatingCount} ratings`);
      const metadata: Record<string, unknown> = {};
      if (r.sellerName) metadata["developer"] = r.sellerName;
      if (r.primaryGenreName) metadata["genre"] = r.primaryGenreName;
      if (r.contentAdvisoryRating)
        metadata["contentRating"] = r.contentAdvisoryRating;
      if (r.version) metadata["version"] = r.version;
      if (r.minimumOsVersion) metadata["minOS"] = r.minimumOsVersion;
      if (r.languages) metadata["languages"] = r.languages;
      if (r.fileSizeBytes)
        metadata["fileSize"] = `${(r.fileSizeBytes / 1048576).toFixed(1)} MB`;
      if (r.currentVersionReleaseDate)
        metadata["updated"] = r.currentVersionReleaseDate;
      if (r.averageUserRating) metadata["userRating"] = r.averageUserRating;
      if (r.userRatingCount) metadata["ratingCount"] = r.userRatingCount;
      if (r.trackViewUrl) metadata["iTunesUrl"] = r.trackViewUrl;
      const images: string[] = [...upscaleITunesImage(r.artworkUrl100)];
      if (r.screenshotUrls) images.push(...r.screenshotUrls.slice(0, 5));
      if (r.ipadScreenshotUrls)
        images.push(...r.ipadScreenshotUrls.slice(0, 3));
      return {
        name: r.trackName!.trim(),
        description:
          r.description?.trim() || parts.join(". ") + "." || "App from iTunes.",
        price: roundPrice(r.price ?? 0),
        category: (r.primaryGenreName ?? "apps").toLowerCase(),
        parentCategory: "Apps",
        images,
        source: "itunes_apps",
        averageRating: clampRating(r.averageUserRating),
        reviewCount: r.userRatingCount ?? 0,
        metadata,
      };
    });
}

async function fetchOpenLibrary(count: number): Promise<NormalizedProduct[]> {
  const limit = Math.min(count, 100);
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(randomTerm(OPENLIBRARY_TERMS))}&limit=${limit}&fields=title,author_name,subject,cover_i,first_publish_year,isbn,publisher,language,number_of_pages_median,edition_count,ratings_average,ratings_count&sort=rating`,
  );
  if (!res.ok) throw new Error(`Open Library API returned ${res.status}`);
  const data = (await res.json()) as {
    docs: Array<{
      title: string;
      author_name?: string[];
      subject?: string[];
      cover_i?: number;
      first_publish_year?: number;
      isbn?: string[];
      publisher?: string[];
      language?: string[];
      number_of_pages_median?: number;
      edition_count?: number;
      ratings_average?: number;
      ratings_count?: number;
    }>;
  };
  return (data.docs ?? [])
    .filter((d) => d.title?.trim().length)
    .map((d) => {
      const parts: string[] = [];
      if (d.author_name?.length)
        parts.push(`By ${d.author_name.slice(0, 3).join(", ")}`);
      if (d.first_publish_year)
        parts.push(`First published ${d.first_publish_year}`);
      const subjects = (d.subject ?? [])
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 1);
      const allowedSet = new Set(OPENLIBRARY_TERMS);
      const category = subjects.find((s) => allowedSet.has(s)) ?? "books";
      const displaySubjects = subjects.slice(0, 3);
      if (displaySubjects.length)
        parts.push(`Subjects: ${displaySubjects.join(", ")}`);
      const metadata: Record<string, unknown> = {};
      if (d.author_name?.length)
        metadata["authors"] = d.author_name.slice(0, 3);
      if (d.first_publish_year)
        metadata["firstPublished"] = d.first_publish_year;
      if (subjects.length) metadata["subjects"] = subjects.slice(0, 5);
      if (d.isbn?.length) metadata["isbn"] = d.isbn.slice(0, 3);
      if (d.publisher?.length) metadata["publishers"] = d.publisher.slice(0, 3);
      if (d.language?.length) metadata["languages"] = d.language;
      if (d.number_of_pages_median)
        metadata["pages"] = d.number_of_pages_median;
      if (d.edition_count) metadata["editions"] = d.edition_count;
      if (d.ratings_average) metadata["avgRating"] = d.ratings_average;
      if (d.ratings_count) metadata["ratingCount"] = d.ratings_count;
      const images: string[] = [];
      if (d.cover_i) {
        images.push(`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`);
        images.push(`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`);
      }
      return {
        name: d.title.trim(),
        description: parts.length
          ? parts.join(". ") + "."
          : "Book from Open Library.",
        price: randomPrice(8, 35),
        category,
        parentCategory: "Books",
        images,
        source: "openlibrary",
        averageRating: clampRating(d.ratings_average),
        reviewCount: d.ratings_count ?? 0,
        metadata,
      };
    });
}

const SOURCE_FETCHERS: Record<
  Exclude<SourceId, "all">,
  (count: number) => Promise<NormalizedProduct[]>
> = {
  off: fetchOpenFoodFacts,
  itunes_movies: fetchITunesMovies,
  itunes_podcasts: fetchITunesPodcasts,
  itunes_apps: fetchITunesApps,
  openlibrary: fetchOpenLibrary,
};

/* ---------- Service ---------- */

@Injectable()
export class DataFeedService {
  private readonly logger = new Logger(DataFeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private emit(event: MiningProgressEvent) {
    this.eventEmitter.emit("mining.progress", event);
  }

  private async ensureSeedUsers(): Promise<string[]> {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const users = await Promise.all(
      SEED_USERS.map((u) =>
        this.prisma.user.upsert({
          where: { email: u.email },
          update: {},
          create: {
            email: u.email,
            passwordHash,
            name: u.name,
          },
        }),
      ),
    );
    return users.map((u) => u.id);
  }

  async getStats() {
    const [products, reviews, users, pendingReviews] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.review.count(),
      this.prisma.user.count(),
      this.prisma.review.count({ where: { status: "PENDING" } }),
    ]);
    const rawByCategory = await this.prisma.product.groupBy({
      by: ["category"],
      _count: true,
      orderBy: { _count: { category: "desc" } },
    });
    const byCategory = rawByCategory.map((row) => ({
      category: row.category,
      _count: row._count,
    }));
    return { products, reviews, users, pendingReviews, byCategory };
  }

  async seed(source: SourceId, count = 100): Promise<SourceResult[]> {
    const seedUserIds = await this.ensureSeedUsers();
    const sources =
      source === "all"
        ? (Object.keys(SOURCE_FETCHERS) as Exclude<SourceId, "all">[])
        : [source];

    this.emit({
      step: "start",
      message: `Starting data mining for ${sources.length} source${sources.length !== 1 ? "s" : ""} (${count} products each)`,
      timestamp: new Date().toISOString(),
      data: { sources, count },
    });

    const results: SourceResult[] = [];

    for (const src of sources) {
      this.emit({
        step: "fetching",
        source: src,
        message: `Fetching from ${SOURCE_LABELS[src] ?? src}...`,
        timestamp: new Date().toISOString(),
      });
      try {
        const result = await this.seedFromSource(src, count, seedUserIds);
        results.push(result);
      } catch (err) {
        this.logger.warn(`Source "${src}" failed: ${err}`);
        this.emit({
          step: "source_error",
          source: src,
          message: `Source ${src} failed: ${err}`,
          timestamp: new Date().toISOString(),
        });
        results.push({ source: src, fetched: 0, inserted: 0, skipped: 0 });
      }
    }

    this.emit({
      step: "complete",
      message: `Mining complete. ${results.reduce((s, r) => s + r.inserted, 0)} products inserted across ${results.length} sources.`,
      timestamp: new Date().toISOString(),
      data: { results },
    });

    return results;
  }

  private async seedFromSource(
    src: Exclude<SourceId, "all">,
    count: number,
    seedUserIds: string[],
  ): Promise<SourceResult> {
    const fetcher = SOURCE_FETCHERS[src];
    this.logger.log(`Fetching from ${src}...`);
    this.emit({
      step: "fetching",
      source: src,
      message: `Connecting to ${SOURCE_LABELS[src] ?? src} API...`,
      timestamp: new Date().toISOString(),
    });
    const products = await fetcher(count);
    this.logger.log(`[${src}] Received ${products.length} products`);
    this.emit({
      step: "fetched",
      source: src,
      message: `Fetched ${products.length} products from ${SOURCE_LABELS[src] ?? src}`,
      timestamp: new Date().toISOString(),
      data: { count: products.length },
    });

    if (products.length === 0) {
      this.emit({
        step: "source_done",
        source: src,
        message: `${SOURCE_LABELS[src] ?? src}: 0 fetched, 0 inserted, 0 skipped`,
        timestamp: new Date().toISOString(),
        data: { fetched: 0, inserted: 0, skipped: 0, reviews: 0 },
      });
      return { source: src, fetched: 0, inserted: 0, skipped: 0 };
    }

    // Dedup: check existing names (case-insensitive)
    const names = products.map((p) => p.name.toLowerCase());
    const existing = await this.prisma.product.findMany({
      where: { name: { in: names, mode: "insensitive" } },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

    // Only use the initial seeded users for generated reviews so real users'
    // accounts are never associated with fabricated seed reviews.
    const userIds = seedUserIds;

    let inserted = 0;
    let skipped = 0;
    let processed = 0;
    let reviewsCreated = 0;

    this.emit({
      step: "inserting",
      source: src,
      message: `Inserting ${products.length} products into database...`,
      timestamp: new Date().toISOString(),
      data: { total: products.length, duplicates: existingNames.size },
    });

    for (const p of products) {
      processed++;

      const reportProgress = () => {
        if (processed % 5 === 0 || processed === products.length) {
          this.emit({
            step: "product_inserted",
            source: src,
            message: `[${src}] Processed ${processed}/${products.length} (${inserted} inserted, ${skipped} skipped)`,
            timestamp: new Date().toISOString(),
            data: {
              processed,
              inserted,
              skipped,
              total: products.length,
              reviewsCreated,
            },
          });
        }
      };

      if (existingNames.has(p.name.toLowerCase())) {
        skipped++;
        reportProgress();
        continue;
      }

      try {
        const product = await this.prisma.product.create({
          data: {
            name: p.name,
            description: p.description,
            price: new Prisma.Decimal(p.price),
            category: p.parentCategory,
            subcategory: p.category,
            images: p.images,
            averageRating: p.averageRating,
            reviewCount: p.reviewCount,
            isActive: true,
            metadata: p.metadata as Prisma.InputJsonValue,
          },
        });
        existingNames.add(p.name.toLowerCase());
        inserted++;

        // Generate embedding for semantic search
        const embedding = await this.embeddingService.embedPassage(
          `${p.name}. ${p.description}`,
        );
        if (embedding) {
          await this.prisma
            .$executeRaw`UPDATE "Product" SET embedding = ${`[${embedding.join(",")}]`}::vector WHERE id = ${product.id}`;
        }

        // Generate review text only for products with real API ratings
        if (userIds.length > 0 && p.averageRating > 0) {
          const numReviews = Math.min(
            Math.max(1, Math.floor(p.reviewCount / 50)),
            5,
          );
          const generated = generateReviewsForProduct(
            product.id,
            userIds,
            numReviews,
            numReviews,
          );
          for (const r of generated) {
            await this.prisma.review.create({
              data: {
                productId: product.id,
                userId: r.userId,
                rating: r.rating,
                title: r.title,
                content: r.content,
                images: [],
                pros: [],
                cons: [],
                helpfulCount: Math.floor(Math.random() * 15),
                notHelpfulCount: Math.floor(Math.random() * 5),
                status: "APPROVED",
              },
            });
            reviewsCreated++;
          }

          // Recalculate product rating/count from actual reviews
          const agg = await this.prisma.review.aggregate({
            where: { productId: product.id, status: "APPROVED" },
            _avg: { rating: true },
            _count: { id: true },
          });
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              averageRating: agg._avg.rating ?? 0,
              reviewCount: agg._count.id,
            },
          });
        } else {
          // No reviews generated — reset to 0 to match actual DB state
          await this.prisma.product.update({
            where: { id: product.id },
            data: { averageRating: 0, reviewCount: 0 },
          });
        }

        reportProgress();
      } catch (err) {
        this.logger.warn(`[${src}] Failed to insert "${p.name}": ${err}`);
        skipped++;
        reportProgress();
      }
    }

    this.logger.log(
      `[${src}] Inserted ${inserted}, skipped ${skipped}, reviews ${reviewsCreated}`,
    );
    return { source: src, fetched: products.length, inserted, skipped };
  }
}
