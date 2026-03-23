import createCache from '@emotion/cache';

// Crée un cache Emotion pour les styles côté client
export default function createEmotionCache() {
    return createCache({ key: 'css', prepend: true });
}
