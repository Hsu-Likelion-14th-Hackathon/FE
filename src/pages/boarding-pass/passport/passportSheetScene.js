import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three'

/** 지면 높이가 화면에서 차지할 비율. 위아래 여백을 남겨 잘려 보이지 않게 한다. */
const FILL_TARGET = 0.92
/** 옆 장이 가장자리에서 물러나 보이도록 살짝 뒤로 눕힌다(라디안). */
const SIDE_TILT = 0.16
/** 옆 장이 뒤로 물러나는 깊이. 지면 폭에 대한 비율이다. */
const SIDE_DEPTH = 0.06

function makeTexture(canvas, maxAnisotropy) {
  const texture = new Texture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearMipmapLinearFilter
  texture.anisotropy = maxAnisotropy
  texture.needsUpdate = true
  return texture
}

/**
 * 여권을 낱장으로 늘어놓고 가로로 밀어 넘기는 장면.
 *
 * 제본된 펼침이 아니라 종이 한 장씩이다. 현재 장이 가운데 오고 앞뒤 장이
 * 양옆에서 살짝 보인다. 옆 장은 조금 뒤로 눕혀 두어 가운데 장이 앞에 있다는
 * 것이 드러난다.
 */
export function createPassportSheets() {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1

  const scene = new Scene()
  // 원근을 얕게 둬야 가운데 장이 정면으로 읽힌다.
  const camera = new PerspectiveCamera(20, 1, 0.1, 5000)

  const key = new DirectionalLight(0xfff2e2, 2.1)
  key.position.set(-0.4, 1.0, 1.3)
  const rim = new DirectionalLight(0xffd9b0, 0.5)
  rim.position.set(0.8, 0.2, -0.6)
  const fill = new AmbientLight(0xffffff, 1.35)
  scene.add(key, rim, fill)

  const geometry = new PlaneGeometry(1, 1)
  /** @type {{mesh: Mesh, material: MeshStandardMaterial, width: number, height: number}[]} */
  let sheets = []
  let owned = []
  // 표지(310)와 내지(253.5)는 폭이 다르다. 실제 여권도 표지가 내지를 감싸므로
  // 억지로 맞추지 않고 각자 크기로 세운다. 간격만 가장 넓은 장을 기준으로 잡는다.
  let layout = { sheetH: 1, gap: 0 }
  let scroll = 0

  function clearSheets() {
    for (const { mesh, material } of sheets) {
      scene.remove(mesh)
      material.dispose()
    }
    sheets = []
  }

  function place() {
    const widest = sheets.reduce((max, sheet) => Math.max(max, sheet.width), 1)
    const pitch = widest + layout.gap
    for (const [index, sheet] of sheets.entries()) {
      // 가운데(=scroll)에서 얼마나 떨어져 있는지. 0이면 정면이다.
      const offset = index - scroll
      const near = Math.min(Math.abs(offset), 1)
      sheet.mesh.position.set(offset * pitch, 0, -near * widest * SIDE_DEPTH)
      sheet.mesh.rotation.y = -Math.max(-1, Math.min(1, offset)) * SIDE_TILT
      sheet.mesh.scale.set(sheet.width, sheet.height, 1)
      // 두 장 너머는 그릴 이유가 없다.
      sheet.mesh.visible = Math.abs(offset) < 2.2
    }
  }

  return {
    canvas: renderer.domElement,

    setSize(width, height, { sheetH, gap }) {
      const w = Math.max(Math.round(width), 1)
      const h = Math.max(Math.round(height), 1)
      renderer.setPixelRatio(Math.min(Math.max(globalThis.devicePixelRatio ?? 1, 2), 3))
      renderer.setSize(w, h, false)

      layout = { sheetH, gap }

      camera.aspect = w / h
      const fitH = sheetH / FILL_TARGET
      camera.position.set(0, 0, fitH / (2 * Math.tan((camera.fov * Math.PI) / 360)))
      camera.updateProjectionMatrix()
      place()
    },

    /**
     * 단계마다 한 장씩, 지면을 순서대로 준다.
     * @param {{canvas: HTMLCanvasElement, width: number, height: number}[]} items
     */
    setSheets(items) {
      for (const texture of owned) texture.dispose()
      owned = []
      clearSheets()

      for (const { canvas, width, height } of items) {
        const material = new MeshStandardMaterial({
          roughness: 0.9,
          metalness: 0.04,
          transparent: true,
        })
        if (canvas) {
          const texture = makeTexture(canvas, maxAnisotropy)
          material.map = texture
          owned.push(texture)
        }
        const mesh = new Mesh(geometry, material)
        scene.add(mesh)
        sheets.push({ mesh, material, width, height })
      }
      place()
    },

    /** 0이면 첫 장이 가운데. 1.5면 두 번째와 세 번째 사이. */
    setScroll(position) {
      scroll = position
      place()
    },

    render() {
      renderer.render(scene, camera)
    },

    dispose() {
      for (const texture of owned) texture.dispose()
      owned = []
      clearSheets()
      geometry.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
