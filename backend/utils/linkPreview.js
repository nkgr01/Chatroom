const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extrait les liens d'un texte
 */
const extractLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

/**
 * Récupère les métadonnées d'un lien pour la prévisualisation
 */
const getLinkPreview = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extraire les métadonnées Open Graph ou standard
    const preview = {
      url,
      title: $('meta[property="og:title"]').attr('content') || 
             $('meta[name="twitter:title"]').attr('content') || 
             $('title').text() || 
             url,
      description: $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="twitter:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || 
                   '',
      image: $('meta[property="og:image"]').attr('content') || 
             $('meta[name="twitter:image"]').attr('content') || 
             '',
      siteName: $('meta[property="og:site_name"]').attr('content') || 
                new URL(url).hostname
    };

    return preview;
  } catch (error) {
    console.error('Erreur lors de la récupération de la prévisualisation:', error.message);
    return {
      url,
      title: url,
      description: '',
      image: '',
      siteName: new URL(url).hostname
    };
  }
};

module.exports = {
  extractLinks,
  getLinkPreview
};
