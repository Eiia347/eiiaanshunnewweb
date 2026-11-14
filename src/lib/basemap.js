import L from 'leaflet'

/**
 * 深空蓝黑基底瓦片。
 * CARTO 对未登记 referer 的域名会打「API KEY REQUIRED」水印，因此改用
 * Esri World Dark Gray Canvas（免密钥、无需注册），再用 CSS 压暗到 #0D1117 基底。
 */
const BASE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
const REF =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'

export function addBasemap(map) {
  const base = L.tileLayer(BASE, {
    maxZoom: 16,
    minZoom: 6,
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a> · Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    crossOrigin: true,
  }).addTo(map)

  const ref = L.tileLayer(REF, {
    maxZoom: 16,
    minZoom: 6,
    opacity: 0.55,
    crossOrigin: true,
  }).addTo(map)

  let failed = 0
  base.on('tileerror', () => {
    failed += 1
    if (failed === 4) map.getContainer().classList.add('map--offline')
  })

  return { base, ref }
}
