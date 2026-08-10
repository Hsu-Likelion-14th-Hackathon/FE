import arenBurgundyImage from '@/assets/images/products/aren-burgundy.webp'
import backpackBlackImage from '@/assets/images/products/backpack-black.webp'
import diamantCinnamonImage from '@/assets/images/products/diamant-cinnamon.webp'
import diamantSoftPinkImage from '@/assets/images/products/diamant-soft-pink.webp'
import duffelBlackImage from '@/assets/images/products/duffel-black.webp'
import newLizBeigeImage from '@/assets/images/products/new-liz-beige.webp'
import pinaCinnamonImage from '@/assets/images/products/pina-cinnamon.webp'

const diamantPinkCardCrop = {
  frameWidth: '43.52%',
  frameAspect: '84 / 55',
  frameLeft: '27.98%',
  frameBottom: '15.79%',
  imageWidth: '226.76%',
  imageLeft: '-61.45%',
  imageTop: '-242.19%',
}

const diamantPinkDetailCrop = {
  frameWidth: '49.23%',
  frameAspect: '192 / 125',
  frameLeft: '25.38%',
  frameBottom: '9.38%',
  imageWidth: '226.76%',
  imageLeft: '-61.45%',
  imageTop: '-242.19%',
}

const diamantCinnamonDetailCrop = {
  frameWidth: '49.23%',
  frameAspect: '192 / 119',
  frameLeft: '25.38%',
  frameBottom: '10.63%',
  imageWidth: '217.39%',
  imageLeft: '-57.61%',
  imageTop: '-245.96%',
}

const newLizCrop = {
  frameWidth: '38.34%',
  frameAspect: '74 / 115',
  frameLeft: '30.57%',
  frameBottom: '15.79%',
  imageWidth: '217.39%',
  imageLeft: '-57.97%',
  imageTop: '-34.08%',
}

const arenCrop = {
  frameWidth: '38.34%',
  frameAspect: '74 / 55',
  frameLeft: '30.57%',
  frameBottom: '15.79%',
  imageWidth: '293.26%',
  imageLeft: '-96.19%',
  imageTop: '-277.43%',
}

const pinaCrop = {
  frameWidth: '61.14%',
  frameAspect: '118 / 50',
  frameLeft: '19.17%',
  frameBottom: '15.79%',
  imageWidth: '154.68%',
  imageLeft: '-26.53%',
  imageTop: '-245.55%',
}

const backpackCrop = {
  frameWidth: '36.79%',
  frameAspect: '71 / 110',
  frameLeft: '31.61%',
  frameBottom: '15.79%',
  imageWidth: '273.97%',
  imageLeft: '-82.74%',
  imageTop: '-68.02%',
}

const duffelCrop = {
  frameWidth: '61.66%',
  frameAspect: '119 / 86',
  frameLeft: '19.17%',
  frameBottom: '15.79%',
  imageWidth: '123.46%',
  imageLeft: '-11.16%',
  imageTop: '-61.51%',
}

const thumbnailPinkCrop = {
  ...diamantPinkCardCrop,
  frameWidth: '70%',
  frameAspect: '42 / 28',
  frameLeft: '15%',
  frameBottom: '10%',
}

const thumbnailCinnamonCrop = {
  ...diamantCinnamonDetailCrop,
  frameWidth: '70%',
  frameAspect: '42 / 26',
  frameLeft: '15%',
  frameBottom: '10%',
}

const primaryVariants = [
  {
    id: 'soft-pink',
    label: 'Soft Pink',
    swatch: 'var(--mcm-color-pink)',
    image: diamantSoftPinkImage,
    stock: 2,
    cardCrop: diamantPinkCardCrop,
    detailCrop: diamantPinkDetailCrop,
    thumbnailCrop: thumbnailPinkCrop,
  },
  {
    id: 'cinnamon',
    label: 'Cinnamon',
    swatch: 'var(--mcm-color-burgundy)',
    image: diamantCinnamonImage,
    stock: 5,
    detailCrop: diamantCinnamonDetailCrop,
    thumbnailCrop: thumbnailCinnamonCrop,
  },
]

export const products = [
  {
    id: 'mcm-001',
    name: 'Diamant 비세토스 3D 참',
    priceLabel: '₩490,000',
    collectionLabel: 'NEW COLLECTION',
    variants: primaryVariants,
    cardVariantId: 'soft-pink',
    initiallyWishlisted: true,
  },
  {
    id: 'mcm-002',
    name: 'New Liz 비세토스 쇼퍼',
    priceLabel: '₩1,050,000',
    collectionLabel: 'NEW COLLECTION',
    variants: [
      {
        id: 'beige',
        label: 'Beige',
        swatch: 'var(--mcm-color-beige)',
        image: newLizBeigeImage,
        stock: 4,
        cardCrop: newLizCrop,
        detailCrop: { ...newLizCrop, frameBottom: '9%' },
        thumbnailCrop: { ...newLizCrop, frameWidth: '58%', frameLeft: '21%', frameBottom: '8%' },
      },
      { id: 'soft-pink', label: 'Soft Pink', swatch: 'var(--mcm-color-pink)' },
      { id: 'cognac', label: 'Cognac', swatch: 'var(--mcm-color-brand-brown)' },
      { id: 'black', label: 'Black', swatch: 'var(--mcm-color-ink)' },
    ],
    cardVariantId: 'beige',
    initiallyWishlisted: false,
  },
  {
    id: 'mcm-003',
    name: 'Aren 비세토스 카드 지갑',
    priceLabel: '₩290,000',
    collectionLabel: 'NEW COLLECTION',
    variants: [
      {
        id: 'burgundy',
        label: 'Burgundy',
        swatch: 'var(--mcm-color-burgundy)',
        image: arenBurgundyImage,
        stock: 3,
        cardCrop: arenCrop,
        detailCrop: { ...arenCrop, frameWidth: '50%', frameLeft: '25%', frameBottom: '11%' },
        thumbnailCrop: { ...arenCrop, frameWidth: '70%', frameLeft: '15%', frameBottom: '10%' },
      },
      { id: 'beige', label: 'Beige', swatch: 'var(--mcm-color-beige)' },
      { id: 'soft-pink', label: 'Soft Pink', swatch: 'var(--mcm-color-pink)' },
      { id: 'olive', label: 'Olive', swatch: 'var(--mcm-color-olive)' },
      { id: 'cognac', label: 'Cognac', swatch: 'var(--mcm-color-brand-brown)' },
      { id: 'black', label: 'Black', swatch: 'var(--mcm-color-ink)' },
    ],
    cardVariantId: 'burgundy',
    initiallyWishlisted: true,
  },
  {
    id: 'mcm-004',
    name: 'Pina 스터드 장식 크로스바디 월렛',
    priceLabel: '₩830,000',
    collectionLabel: 'NEW COLLECTION',
    variants: [
      {
        id: 'cognac',
        label: 'Cognac',
        swatch: 'var(--mcm-color-brand-brown)',
        image: pinaCinnamonImage,
        stock: 3,
        cardCrop: pinaCrop,
        detailCrop: { ...pinaCrop, frameWidth: '72%', frameLeft: '14%', frameBottom: '10%' },
        thumbnailCrop: { ...pinaCrop, frameWidth: '80%', frameLeft: '10%', frameBottom: '10%' },
      },
    ],
    cardVariantId: 'cognac',
    initiallyWishlisted: false,
  },
  {
    id: 'mcm-005',
    name: 'Diamant 비세토스 3D 참',
    priceLabel: '₩490,000',
    collectionLabel: 'NEW COLLECTION',
    variants: [
      {
        id: 'black',
        label: 'Black',
        swatch: 'var(--mcm-color-ink)',
        image: backpackBlackImage,
        stock: 2,
        cardCrop: backpackCrop,
        detailCrop: { ...backpackCrop, frameWidth: '42%', frameLeft: '29%', frameBottom: '8%' },
        thumbnailCrop: { ...backpackCrop, frameWidth: '50%', frameLeft: '25%', frameBottom: '7%' },
      },
      { id: 'burgundy', label: 'Burgundy', swatch: 'var(--mcm-color-burgundy)' },
    ],
    cardVariantId: 'black',
    initiallyWishlisted: false,
  },
  {
    id: 'mcm-006',
    name: 'New Liz 비세토스 쇼퍼',
    priceLabel: '₩1,050,000',
    collectionLabel: 'NEW COLLECTION',
    variants: [
      {
        id: 'black',
        label: 'Black',
        swatch: 'var(--mcm-color-ink)',
        image: duffelBlackImage,
        stock: 1,
        cardCrop: duffelCrop,
        detailCrop: { ...duffelCrop, frameWidth: '72%', frameLeft: '14%', frameBottom: '8%' },
        thumbnailCrop: { ...duffelCrop, frameWidth: '80%', frameLeft: '10%', frameBottom: '8%' },
      },
      { id: 'beige', label: 'Beige', swatch: 'var(--mcm-color-beige)' },
      { id: 'soft-pink', label: 'Soft Pink', swatch: 'var(--mcm-color-pink)' },
      { id: 'cognac', label: 'Cognac', swatch: 'var(--mcm-color-brand-brown)' },
    ],
    cardVariantId: 'black',
    initiallyWishlisted: true,
  },
]

export function getProduct(productId) {
  return products.find(({ id }) => id === productId)
}

export function getProductVariant(product, variantId) {
  const fallbackVariant = product.variants.find(({ image }) => image) ?? product.variants[0]
  const selectedVariant = product.variants.find(({ id }) => id === variantId)

  if (!selectedVariant?.image) {
    return fallbackVariant
  }

  return selectedVariant
}
