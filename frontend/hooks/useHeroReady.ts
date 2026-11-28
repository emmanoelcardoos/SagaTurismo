'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const FALLBACK_TIMEOUT_MS = 3500;

/**
 * Otimiza URLs de CDNs públicos que suportam redimensionamento via URL
 * (Pexels / Cloudinary), mantendo demais URLs intactas.
 */
export function optimizeHeroUrl(url?: string | null): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    // Pexels (Imgix): remove parâmetros _gl de analytics e entrega ~1600px comprimido
    if (parsed.hostname === 'images.pexels.com') {
      return `${parsed.origin}${parsed.pathname}?auto=compress&cs=tinysrgb&w=1600`;
    }

    // Cloudinary: adiciona limite de largura de 1600px preservando f_auto,q_auto
    if (
      parsed.hostname === 'res.cloudinary.com' &&
      parsed.pathname.includes('/image/upload/f_auto,q_auto/') &&
      !parsed.pathname.includes('w_')
    ) {
      return url.replace(
        '/image/upload/f_auto,q_auto/',
        '/image/upload/f_auto,q_auto,w_1600,c_limit/'
      );
    }
  } catch {
    // URL relativa ou inválida — retorna sem alterar
  }

  return url;
}

/**
 * Sincroniza a exibição da imagem e do título da Hero Section para que ambos
 * apareçam no mesmo instante, aguardando o download e o decode da imagem.
 */
export function useHeroImageReady(src?: string | null) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isReady, setIsReady] = useState(!src);

  const revealAfterDecode = useCallback((img?: HTMLImageElement | null) => {
    if (img && typeof img.decode === 'function') {
      img
        .decode()
        .catch(() => {
          // Alguns navegadores rejeitam decode() em imagens já decodificadas ou formatos especiais
        })
        .finally(() => {
          setIsReady(true);
        });
    } else {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!src) {
      setIsReady(true);
      return;
    }

    let cancelled = false;
    const img = imgRef.current;

    // Se a imagem já estiver em cache e carregada, revela imediatamente
    if (img && img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .catch(() => {})
          .finally(() => {
            if (!cancelled) setIsReady(true);
          });
      } else {
        setIsReady(true);
      }
      return () => {
        cancelled = true;
      };
    }

    setIsReady(false);

    // Fallback de segurança para conexões muito lentas ou falha silenciosa
    const timer = window.setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, FALLBACK_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [src]);

  const onLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      revealAfterDecode(e.currentTarget);
    },
    [revealAfterDecode]
  );

  const onError = useCallback(() => {
    setIsReady(true);
  }, []);

  return {
    imgRef,
    isReady,
    onLoad,
    onError,
  };
}

/**
 * Sincroniza a exibição do vídeo de fundo e do título da Hero Section.
 */
export function useHeroVideoReady() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      setIsReady(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsReady(true);
    }, FALLBACK_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const onLoadedData = useCallback(() => {
    setIsReady(true);
  }, []);

  const onError = useCallback(() => {
    setIsReady(true);
  }, []);

  return {
    videoRef,
    isReady,
    onLoadedData,
    onError,
  };
}
