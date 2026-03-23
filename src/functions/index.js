// import Resizer from "react-image-file-resizer";

// export const resizeFile = (file) =>
//   new Promise((resolve) => {
//     Resizer.imageFileResizer(
//       file,
//       600,
//       600,
//       "JPEG",
//       100,
//       0,
//       (uri) => {
//         resolve(uri);
//       },
//       "base64"
//     );
//   });

export function createSlug(title) {
  return title
    .toLowerCase() // Convertit en minuscules
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9 -]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Évite les tirets en double
    .trim(); // Supprime les espaces inutiles
}

export function getYouTubeShortsID(url) {
  const match = url?.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null; // retourne null si aucun ID n'est trouvé
}
