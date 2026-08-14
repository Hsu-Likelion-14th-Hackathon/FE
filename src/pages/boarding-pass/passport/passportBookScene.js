import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  FrontSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'

import { createBendUniforms, createPaperMaterial } from './paperMaterial.js'

/**
 * 여권을 3D 책으로 그린다.
 *
 * 조명·색공간은 three의 MeshStandardMaterial에 맡기고(paperMaterial 참고),
 * 이 모듈은 배치·카메라·넘김 진행도만 다룬다.
 */

const PAGE_ASPECT = 253.5 / 394
/** 넘어가는 장이 고정 페이지 위로 떠 있을 z 간격 */
const LAYER = 0.6
/** 페이지 높이가 화면에서 차지할 비율. 나머지는 여백 */
const FILL_TARGET = 0.92

function makeTexture(canvas, maxAnisotropy) {
  const texture = new CanvasTexture(canvas)
  // 페이지 텍스처는 항상 축소되어 그려지므로 밉맵 없이는 계단현상이 생긴다.
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = maxAnisotropy
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function createPassportBook() {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1

  const scene = new Scene()
  // 원근을 얕게 둬서 정면 가독성을 지키면서 두께만 드러낸다.
  const camera = new PerspectiveCamera(20, 1, 0.1, 5000)

  // 위 앞쪽 키 라이트가 금박과 종이 결을 살리고, 림 라이트가 가장자리를 띄운다.
  const key = new DirectionalLight(0xfff2e2, 2.1)
  key.position.set(-0.4, 1.0, 1.3)
  const rim = new DirectionalLight(0xffd9b0, 0.5)
  rim.position.set(0.8, 0.2, -0.6)
  const fill = new AmbientLight(0xffffff, 1.35)
  scene.add(key, rim, fill)

  const book = new Group()
  scene.add(book)

  const planeGeometry = new PlaneGeometry(1, 1)
  const leftMaterial = new MeshStandardMaterial({ roughness: 0.9, metalness: 0.04 })
  const rightMaterial = new MeshStandardMaterial({ roughness: 0.9, metalness: 0.04 })
  const leftPage = new Mesh(planeGeometry, leftMaterial)
  const rightPage = new Mesh(planeGeometry, rightMaterial)
  book.add(leftPage, rightPage)

  // 페이지가 쌓인 두께. 좌우 단면과 책등.
  const edgeGeometry = new BoxGeometry(1, 1, 1)
  const edgeMaterial = new MeshStandardMaterial({ color: new Color(0x2a1408), roughness: 0.95 })
  const spineMaterial = new MeshStandardMaterial({ color: new Color(0x3a1c0c), roughness: 0.85 })
  const leftEdge = new Mesh(edgeGeometry, edgeMaterial)
  const rightEdge = new Mesh(edgeGeometry, edgeMaterial)
  const spine = new Mesh(edgeGeometry, spineMaterial)
  book.add(leftEdge, rightEdge, spine)

  // 넘어가는 장. 경첩이 x=0에 오도록 평면을 오른쪽으로 옮긴다.
  const leafGeometry = new PlaneGeometry(1, 1, 60, 2)
  leafGeometry.translate(0.5, 0, 0)
  const bend = createBendUniforms(1)
  const blankFront = makeTexture(document.createElement('canvas'), maxAnisotropy)
  const blankBack = makeTexture(document.createElement('canvas'), maxAnisotropy)
  const frontMaterial = createPaperMaterial(blankFront, FrontSide, bend)
  const backMaterial = createPaperMaterial(blankBack, BackSide, bend)
  const leafFront = new Mesh(leafGeometry, frontMaterial)
  const leafBack = new Mesh(leafGeometry, backMaterial)
  const leaf = new Group()
  leaf.add(leafFront, leafBack)
  leaf.visible = false
  book.add(leaf)

  let owned = []
  let layout = { pageW: 1, pageH: 1 }

  function assign(material, canvas) {
    if (!canvas) return
    const texture = makeTexture(canvas, maxAnisotropy)
    material.map?.dispose?.()
    material.map = texture
    material.needsUpdate = true
    owned.push(texture)
  }

  function assignLeaf(material, canvas, side) {
    if (!canvas) return
    const texture = makeTexture(canvas, maxAnisotropy)
    if (side === BackSide) {
      // 뒤에서 보는 면이라 좌우를 뒤집는다.
      texture.repeat.x = -1
      texture.offset.x = 1
    }
    material.map?.dispose?.()
    material.map = texture
    material.needsUpdate = true
    owned.push(texture)
  }

  return {
    canvas: renderer.domElement,

    /**
     * 뷰포트 크기와 책 배치를 준다.
     *
     * pageW/shift를 직접 받는 이유: 표지(한 장)와 펼침(두 면)은 폭도 위치도 달라서,
     * 전환 중에는 두 배치 사이를 보간한 값이 들어와야 책이 순간이동하지 않는다.
     */
    setSize(width, height, { pageW, pageH, shift, spread }) {
      const w = Math.max(Math.round(width), 1)
      const h = Math.max(Math.round(height), 1)
      renderer.setPixelRatio(Math.min(Math.max(globalThis.devicePixelRatio ?? 1, 2), 3))
      renderer.setSize(w, h, false)

      const thickness = Math.max(pageW * 0.018, 2)
      layout = { pageW, pageH }

      camera.aspect = w / h
      // 페이지 높이가 화면의 FILL_TARGET만큼 차지하도록 거리를 맞춘다.
      const fitH = pageH / FILL_TARGET
      camera.position.set(0, 0, fitH / (2 * Math.tan((camera.fov * Math.PI) / 360)))
      camera.updateProjectionMatrix()

      // Figma는 좌측 면을 화면 중앙에 두고 우측을 화면 밖으로 흘린다.
      book.position.x = shift

      leftPage.scale.set(pageW, pageH, 1)
      rightPage.scale.set(pageW, pageH, 1)
      leftPage.position.set(-pageW / 2, 0, 0)
      rightPage.position.set(spread ? pageW / 2 : 0, 0, 0)

      leftEdge.scale.set(thickness, pageH * 0.985, thickness * 2)
      rightEdge.scale.set(thickness, pageH * 0.985, thickness * 2)
      leftEdge.position.set(-pageW - thickness / 2, 0, -thickness)
      rightEdge.position.set(pageW + thickness / 2, 0, -thickness)

      spine.scale.set(pageW * 0.02, pageH, thickness * 2.4)
      spine.position.set(0, 0, -thickness * 1.2)

      leaf.scale.set(1, pageH, 1)
      leafFront.scale.set(pageW, 1, 1)
      leafBack.scale.set(pageW, 1, 1)
      bend.uWidth.value = pageW
    },

    /** 좌·우 고정 면과, 넘어가는 장의 앞뒤 면을 canvas로 준다. */
    setPages({ left, right, turningFront, turningBack }) {
      for (const texture of owned) texture.dispose()
      owned = []
      leftPage.visible = Boolean(left)
      assign(leftMaterial, left)
      rightPage.visible = Boolean(right)
      assign(rightMaterial, right)
      assignLeaf(frontMaterial, turningFront, FrontSide)
      assignLeaf(backMaterial, turningBack, BackSide)

      // 표지 단계에서는 단면을 숨겨 한 장짜리로 보이게 한다.
      // Figma에는 밝은 종이 단면이 없다. 좌우 단면은 숨기고 책등만 남긴다.
      const bothPages = Boolean(left) && Boolean(right)
      leftEdge.visible = false
      rightEdge.visible = false
      spine.visible = bothPages
    },

    /** progress 0~1. direction>0이면 오른쪽 장이 왼쪽으로 넘어간다. */
    setTurn(progress, direction) {
      // 상한을 두지 않는다. progress=1에서 leaf를 숨기면 새 페이지가 그려지기 전
      // 이전 좌측 면이 한두 프레임 드러나 깜빡인다. 다음 정지 렌더가 대신 숨긴다.
      const active = progress > 0.001
      leaf.visible = active
      if (!active) return

      const t = direction > 0 ? progress : 1 - progress
      // 경첩은 접지선(book 기준 x=0)에 있다. book 자체가 이미 반 페이지 옮겨져 있으므로
      // 여기서 또 더하면 장이 화면 밖으로 나간다.
      leaf.rotation.y = -Math.PI * t
      leaf.position.set(0, 0, LAYER)
      // 중간에서 가장 크게 말린다. uBend 1.0이면 arc가 약 109°까지 휜다.
      const curve = Math.sin(Math.PI * t)
      bend.uBend.value = curve * 1.0
      bend.uDroop.value = curve * layout.pageW * 0.09
    },

    render() {
      renderer.render(scene, camera)
    },

    dispose() {
      for (const texture of owned) texture.dispose()
      owned = []
      blankFront.dispose()
      blankBack.dispose()
      planeGeometry.dispose()
      leafGeometry.dispose()
      edgeGeometry.dispose()
      leftMaterial.dispose()
      rightMaterial.dispose()
      edgeMaterial.dispose()
      spineMaterial.dispose()
      frontMaterial.dispose()
      backMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
