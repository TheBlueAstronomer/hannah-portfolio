export default {
    name: 'article',
    title: 'Articles',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            description: 'The article headline as it appears on the publication.',
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'publication',
            title: 'Publication',
            type: 'string',
            description: 'e.g. Forbes, Deadline, Business Insider',
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'category',
            title: 'Category Label',
            type: 'string',
            description: 'Short label shown on the card, e.g. "FEATURE — FORBES"',
        },
        {
            name: 'date',
            title: 'Publication Date',
            type: 'date',
            options: {
                dateFormat: 'MMMM D, YYYY',
            },
        },
        {
            name: 'url',
            title: 'Article URL',
            type: 'url',
            description: 'The full URL to the live article.',
            validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
        },
        {
            name: 'cardColor',
            title: 'Card Background Color',
            type: 'string',
            description: 'Hex color for the card background, e.g. #C3C0D8',
        },
        {
            name: 'accentColor',
            title: 'Card Accent Color',
            type: 'string',
            description: 'Hex color for card text and accents, e.g. #584B77',
        },
        {
            name: 'order',
            title: 'Display Order',
            type: 'number',
            description: 'Lower numbers appear first in the card shuffler.',
        },
        {
            name: 'isHeadline',
            title: 'Show in Typewriter Feed',
            type: 'boolean',
            description: 'If enabled, this article\'s title appears in the Live Entertainment Feed typewriter.',
            initialValue: false,
        },
        {
            name: 'isFeatured',
            title: 'Show in Card Shuffler',
            type: 'boolean',
            description: 'If enabled, this article appears as a card in the Featured Interviews stack.',
            initialValue: true,
        },
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'publication',
        },
    },
    orderings: [
        {
            title: 'Display Order',
            name: 'orderAsc',
            by: [{ field: 'order', direction: 'asc' }],
        },
        {
            title: 'Date (Newest First)',
            name: 'dateDesc',
            by: [{ field: 'date', direction: 'desc' }],
        },
    ],
};
