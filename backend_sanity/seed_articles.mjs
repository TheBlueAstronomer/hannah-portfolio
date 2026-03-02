// Seed script for Hannah Abraham's articles in Sanity
// Run with: node /tmp/seed_articles.mjs

import { createClient } from '@sanity/client';

const client = createClient({
    projectId: '3rrd1p6a',
    dataset: 'production',
    apiVersion: '2023-05-03',
    token: 'skuwN6iSDBRLDQQrHghIE4ozsjJwotOpA3wpApZejEcrcrHvrXCkytjBWg2foh880dZmN0YmvE0d195wYP4Dp0pz7sMY7M7K2COatU4pjG189iXpjUXyOzolQVVNEaArntPyaa0aLOtxvLs4gk9vJKFEoeTKLkPdtaNesWbtbiWeOZqIOrZR',
    useCdn: false,
});

// Featured card articles (isFeatured: true)
const cardArticles = [
    {
        _type: 'article',
        _id: 'article-boong-bafta',
        title: "BAFTA-Winning Director Lakshmipriya Devi On 'Boong': 'Everyone Told Me Not To Make It'",
        publication: 'Forbes',
        category: 'FEATURE — FORBES',
        date: '2026-02-28',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/28/bafta-winning-director-lakshmipriya-devi-on-boong-everyone-told-me-not-to-make-it/',
        cardColor: '#C3C0D8',
        accentColor: '#584B77',
        order: 1,
        isFeatured: true,
        isHeadline: false,
    },
    {
        _type: 'article',
        _id: 'article-lin-manuel-mufasa',
        title: "'Mufasa' Songwriter Lin-Manuel Miranda On Working With Barry Jenkins & Why The 'Hamilton' Parallel Is A Myth",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-12-10',
        url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/',
        cardColor: '#E8E4F0',
        accentColor: '#3D3460',
        order: 2,
        isFeatured: true,
        isHeadline: false,
    },
    {
        _type: 'article',
        _id: 'article-outstation-boyband',
        title: "The Very Beginning Of Outstation: Inside India's Most Ambitious Boyband",
        publication: 'Forbes',
        category: 'LONG READ — FORBES',
        date: '2026-02-27',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/27/the-very-beginning-of-outstation/',
        cardColor: '#F4F0FA',
        accentColor: '#584B77',
        order: 3,
        isFeatured: true,
        isHeadline: false,
    },
    {
        _type: 'article',
        _id: 'article-actor-awards-oscars',
        title: '2026 Actor Awards Shake Up The Oscar Race: A Category-By-Category Breakdown',
        publication: 'Forbes',
        category: 'ANALYSIS — FORBES',
        date: '2026-03-01',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/what-the-actor-awards-2026-tell-us-about-the-oscar-race-a-category-by-category-breakdown/',
        cardColor: '#DDD9EF',
        accentColor: '#3D3460',
        order: 4,
        isFeatured: true,
        isHeadline: false,
    },
    {
        _type: 'article',
        _id: 'article-munjya-sharvari',
        title: "'Munjya' Star Sharvari On Finding Success In Bollywood & Her Desire To Work With Greta Gerwig",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-07-15',
        url: 'https://deadline.com/2024/07/munjya-sharvari-bollywood-greta-gerwig-yrf-alia-bhatt-1235999575/',
        cardColor: '#EAE7F5',
        accentColor: '#584B77',
        order: 5,
        isFeatured: true,
        isHeadline: false,
    },
    {
        _type: 'article',
        _id: 'article-cjenm-ceo',
        title: 'CJ ENM CEO On $800M Content Strategy, IP Transformation And Hollywood Ambitions',
        publication: 'Forbes',
        category: 'FEATURE — FORBES',
        date: '2026-02-16',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/16/cj-enm-ceo-on-800m-content-strategy-ip-transformation-and-no-other-choice-oscar-disappointment/',
        cardColor: '#C8C5DE',
        accentColor: '#3D3460',
        order: 6,
        isFeatured: true,
        isHeadline: false,
    },
];

// Typewriter headline articles (isHeadline: true)
const headlineArticles = [
    {
        _type: 'article',
        _id: 'article-headline-kalki',
        title: "'Kalki 2898 AD': Inside the Prabhas-Starring Sci-Fi Epic That Is One Of India's Most Expensive Movies Of All Time.",
        publication: 'Deadline',
        category: 'FEATURE — DEADLINE',
        date: '2024-05-20',
        url: 'https://deadline.com/2024/05/kalki-2898-ad-exploring-nag-ashwin-prabhas-amitabh-bachchan-deepika-padukone-movie-1235942384/',
        order: 10,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-lin-manuel',
        title: "Lin-Manuel Miranda on 'Mufasa': why the Hamilton parallel is a myth, and what it really means to write for Barry Jenkins.",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-12-10',
        url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/',
        order: 11,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-village-paradise',
        title: "Somali director Mo Harawe on history-making Cannes title 'The Village Next To Paradise': \"For 70% of the crew, it was their first time on a film set.\"",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-05-22',
        url: 'https://deadline.com/2024/05/somali-director-mo-harawe-the-village-next-to-paradise-cannes-1235922994/',
        order: 12,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-vicky-mcclure',
        title: "Vicky McClure steps out of her comfort zone in Paramount+ thriller 'Insomnia' — and talks candidly about life after Line Of Duty.",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-05-10',
        url: 'https://deadline.com/2024/05/vicky-mcclure-paramount-plus-insomnia-line-of-duty-1235907283/',
        order: 13,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-goat-life',
        title: "'The Goat Life': how a Malayalam epic is proof that Indian cinema is so much more than Bollywood.",
        publication: 'Deadline',
        category: 'FEATURE — DEADLINE',
        date: '2024-05-08',
        url: 'https://deadline.com/2024/05/the-goat-life-malayalam-bollywood-global-breakouts-1235903482/',
        order: 14,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-minheeJin',
        title: "Former NewJeans EP Min Hee Jin wins $18 million court battle against HYBE — reshaping K-pop's power dynamics.",
        publication: 'Forbes',
        category: 'NEWS — FORBES',
        date: '2026-02-12',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/12/former-newjeans-ep-min-hee-jin-wins-18-million-court-battle-against-hybe/',
        order: 15,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-harrison-ford',
        title: "Harrison Ford fights back tears accepting the SAG Life Achievement Award: 'It's a little early.'",
        publication: 'Forbes',
        category: 'NEWS — FORBES',
        date: '2026-03-01',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/harrison-ford-fights-back-tears-while-accepting-sag-life-achievement-award-im-at-the-half-point-of-my-career/',
        order: 16,
        isFeatured: false,
        isHeadline: true,
    },
    {
        _type: 'article',
        _id: 'article-headline-bad-bunny',
        title: "Bad Bunny's Super Bowl halftime show: every cultural reference, broken down — and what it means for Latin music in 2026.",
        publication: 'Forbes',
        category: 'FEATURE — FORBES',
        date: '2026-02-08',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/08/what-did-bad-bunnys-halftime-show-mean-every-cultural-reference-broken-down/',
        order: 17,
        isFeatured: false,
        isHeadline: true,
    },
];

const allArticles = [...cardArticles, ...headlineArticles];

async function seed() {
    console.log(`Seeding ${allArticles.length} article documents into Sanity...`);

    // Use createOrReplace to be idempotent
    const transaction = client.transaction();
    for (const article of allArticles) {
        transaction.createOrReplace(article);
    }

    try {
        const result = await transaction.commit();
        console.log(`✓ Successfully seeded ${allArticles.length} articles.`);
        console.log(`  Transaction ID: ${result.transactionId}`);
    } catch (err) {
        console.error('✗ Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
