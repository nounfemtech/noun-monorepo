import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { cn } from '@/lib/utils'
import { StatsCard } from '@/components/stats-card'
import { TenantGestaoZones } from './tenant-actions'
import { NovoTenantForm, type TenantEditData } from '../novo/form'
import { TenantRevenueChart } from './tenant-revenue-chart'
import { TenantMetricasBlocks } from './tenant-metricas-blocks'
import type { BlocksData, BlockMetrics } from '@/app/(admin)/dashboard/dashboard-blocks'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Fragment } from 'react'
import { TransactionsEmpty } from '@/app/(admin)/dashboard/transactions-empty'
import { IconCreditCard } from '@tabler/icons-react'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const EMPTY_METRICS: BlockMetrics = {
  new_patients: 0, active_patients: 0, scheduled: 0, completed: 0,
  cancelled: 0, avg_days_to_first: null, orders_total: 0, orders_delivered: 0,
  avg_ticket: 0, top_pharmacies: [], active_tenants: 0, earn_gmv: 0, earn_fee: 0,
}
const EMPTY_BLOCKS: BlocksData = {
  mes: EMPTY_METRICS, '3meses': EMPTY_METRICS, '6meses': EMPTY_METRICS,
  ano: EMPTY_METRICS, retention_rate: 0, churned_tenants: 0,
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const SUBTYPE_LABELS: Record<string, string> = {
  clinico_geral:    'Clínico Geral',
  endocrinologista: 'Endocrinologista',
  ginecologista:    'Ginecologista',
  urologista:       'Urologista',
  psiquiatra:       'Psiquiatra',
  nutrologo:        'Nutrólogo',
  psicologo:        'Psicólogo',
  nutricionista:    'Nutricionista',
  farmacia:         'Farmácia',
}

function statusLabel(status: string) {
  switch (status) {
    case 'active':    return 'Ativo'
    case 'suspended': return 'Suspenso'
    case 'draft':     return 'Rascunho'
    default:          return status
  }
}

function PaymentIcon({ method, brand }: { method: string | null; brand: string | null }) {
  if (brand === 'visa') return (
    <svg width="51" height="36" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F5F5F5"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.7501 15.8582H8.69031L7.14576 9.79235C7.07245 9.51332 6.91679 9.26664 6.68782 9.15038C6.11639 8.85821 5.48672 8.62568 4.7998 8.50841V8.27487H8.11789C8.57583 8.27487 8.91929 8.62568 8.97653 9.0331L9.77793 13.4086L11.8367 8.27487H13.8392L10.7501 15.8582ZM14.984 15.8582H13.0388L14.6406 8.27487H16.5858L14.984 15.8582ZM19.1025 10.3757C19.1597 9.96725 19.5032 9.73372 19.9039 9.73372C20.5336 9.67508 21.2195 9.79235 21.7919 10.0835L22.1354 8.45079C21.5629 8.21725 20.9333 8.09998 20.3619 8.09998C18.4738 8.09998 17.1 9.15038 17.1 10.6082C17.1 11.7173 18.0731 12.2996 18.7601 12.6504C19.5032 13.0002 19.7894 13.2337 19.7322 13.5835C19.7322 14.1082 19.1597 14.3418 18.5883 14.3418C17.9014 14.3418 17.2145 14.1669 16.5858 13.8747L16.2424 15.5084C16.9293 15.7996 17.6724 15.9169 18.3594 15.9169C20.4763 15.9745 21.7919 14.9251 21.7919 13.35C21.7919 11.3664 19.1025 11.2502 19.1025 10.3757V10.3757ZM28.5998 15.8582L27.0553 8.27487H25.3962C25.0528 8.27487 24.7093 8.50841 24.5948 8.85821L21.7347 15.8582H23.7372L24.1369 14.7502H26.5973L26.8263 15.8582H28.5998ZM25.6824 10.3171L26.2539 13.1751H24.6521L25.6824 10.3171Z" fill="#172B85"/>
    </svg>
  )
  if (brand === 'mastercard') return (
    <svg width="51" height="36" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F5F5F5"/>
      <path d="M21.5771 5.02997C25.322 5.02997 28.3584 8.02986 28.3584 11.7302C28.3583 15.4304 25.322 18.4304 21.5771 18.4304C19.8982 18.4303 18.3629 17.8256 17.1787 16.8268C15.9945 17.8254 14.4591 18.4304 12.7803 18.4304C9.03566 18.4301 6.00011 15.4302 6 11.7302C6 8.02999 9.03559 5.03019 12.7803 5.02997C14.459 5.02997 15.9945 5.63405 17.1787 6.63251C18.3629 5.63391 19.8983 5.03 21.5771 5.02997Z" fill="#ED0006"/>
      <path d="M21.5771 5.02997C25.322 5.03005 28.3574 8.02991 28.3574 11.7302C28.3573 15.4303 25.3219 18.4303 21.5771 18.4304C19.8982 18.4304 18.3629 17.8255 17.1787 16.8268C18.6359 15.598 19.5615 13.7714 19.5615 11.7302C19.5615 9.68867 18.6361 7.8614 17.1787 6.63251C18.3629 5.63397 19.8984 5.02997 21.5771 5.02997Z" fill="#F9A000"/>
      <path d="M17.1787 6.63251C18.6363 7.86141 19.5615 9.68853 19.5615 11.7302C19.5615 13.7716 18.636 15.598 17.1787 16.8268C15.7217 15.598 14.7969 13.7713 14.7969 11.7302C14.7969 9.68882 15.7215 7.8614 17.1787 6.63251Z" fill="#FF5E00"/>
    </svg>
  )
  if (brand === 'elo') return (
    <svg width="51" height="36" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F5F5F5"/>
      <path d="M7.82406 9.49573C8.11175 9.40141 8.41952 9.35019 8.73975 9.35019C10.1373 9.35019 11.3031 10.3241 11.5705 11.6178L13.5509 11.2216C13.0965 9.0229 11.1154 7.3678 8.73975 7.3678C8.19585 7.3678 7.67231 7.45472 7.18359 7.61484L7.82406 9.49573Z" fill="#FECA2F"/>
      <path d="M5.46727 15.8677L6.65306 14.3366C6.12376 13.8012 5.78968 13.0196 5.78968 12.1484C5.78968 11.2778 6.12344 10.4962 6.6526 9.96122L5.46618 8.4303C4.56678 9.33989 4 10.6686 4 12.1484C4 13.629 4.56761 14.9581 5.46727 15.8677" fill="#1BA7DE"/>
      <path d="M11.5711 12.6802C11.3028 13.9737 10.1377 14.9464 8.74142 14.9464C8.42105 14.9464 8.11268 14.895 7.82497 14.8004L7.18359 16.6823C7.67307 16.8432 8.19677 16.9302 8.74142 16.9302C11.1149 16.9302 13.0947 15.2762 13.5509 13.0783L11.5711 12.6802Z" fill="#EC412A"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M23.0798 8.4303V13.8716L24.0563 14.263L23.5944 15.3362L22.6287 14.948C22.4116 14.857 22.2647 14.7183 22.153 14.5616C22.0458 14.4013 21.9664 14.1822 21.9664 13.8865V8.4303H23.0798ZM15.6742 12.4744C15.6984 10.9184 17.0236 9.67627 18.6315 9.70011C19.9963 9.72081 21.1271 10.6452 21.4241 11.8746L16.1457 14.0562C15.8391 13.6029 15.6648 13.0576 15.6742 12.4744ZM16.8819 12.6926C16.8747 12.6273 16.8696 12.5603 16.8715 12.4928C16.8867 11.576 17.6668 10.8445 18.6142 10.8597C19.1298 10.8663 19.5877 11.0947 19.8972 11.4481L16.8819 12.6926ZM19.7861 13.7028C19.468 14.002 19.0366 14.1843 18.5603 14.1778C18.2338 14.1725 17.9312 14.078 17.674 13.9205L17.0364 14.903C17.4731 15.1699 17.988 15.3278 18.5431 15.3361C19.3512 15.3478 20.0877 15.0408 20.6232 14.534L19.7861 13.7028ZM27.1438 10.8596C26.9536 10.8596 26.7708 10.8894 26.6 10.9448L26.22 9.84383C26.51 9.75019 26.8206 9.69933 27.1438 9.69933C28.5541 9.69933 29.7306 10.6681 30.0004 11.9549L28.8242 12.1868C28.6657 11.4294 27.9736 10.8596 27.1438 10.8596ZM25.2127 14.629L26.0074 13.76C25.6524 13.4561 25.4289 13.0123 25.4289 12.5176C25.4289 12.0235 25.6524 11.5799 26.0071 11.2763L25.2118 10.4072C24.6088 10.9236 24.2289 11.678 24.2289 12.5176C24.2289 13.3583 24.6091 14.1125 25.2127 14.629ZM27.1437 14.1763C27.9727 14.1763 28.6648 13.607 28.8242 12.8507L30 13.0836C29.7289 14.369 28.5527 15.3364 27.1437 15.3364C26.8203 15.3364 26.5093 15.2854 26.2185 15.1913L26.5994 14.0908C26.7704 14.146 26.9534 14.1763 27.1437 14.1763Z" fill="black"/>
    </svg>
  )
  if (brand === 'google_pay' || method === 'google_pay') return (
    <svg width="51" height="36" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F5F5F5"/>
      <path d="M26.7119 14.1301H26.7295L28.1465 10.5715H29.1436L26.0801 17.7062H25.1348L26.2734 15.2101L24.2637 10.5715H25.2598L26.7119 14.1301ZM21.918 10.4094C22.5953 10.4094 23.1306 10.5944 23.5234 10.9582C23.9163 11.3221 24.1093 11.8307 24.1094 12.4719V15.5275H23.2334V14.841H23.1934C22.8119 15.4069 22.3106 15.6895 21.6787 15.6896C21.1435 15.6896 20.6878 15.5278 20.3291 15.2043C19.9761 14.9039 19.7767 14.4593 19.7881 13.9914C19.7881 13.4772 19.9818 13.0729 20.3633 12.7668C20.7447 12.4607 21.2569 12.3108 21.8945 12.3107C22.441 12.3107 22.8853 12.4142 23.2383 12.6105V12.3967C23.2382 12.0791 23.1023 11.7784 22.8633 11.5705C22.6185 11.351 22.3049 11.2297 21.9805 11.2297C21.468 11.2297 21.0637 11.4498 20.7676 11.8888L19.959 11.3742C20.3917 10.7331 21.0469 10.4094 21.918 10.4094ZM17.5732 8.28338C18.1596 8.2719 18.7289 8.49746 19.1445 8.91326C19.9759 9.69891 20.0272 11.0221 19.2471 11.8713L19.1445 11.9748C18.7175 12.3849 18.1938 12.5929 17.5732 12.5929H16.0586V15.5275H15.1416V8.28338H17.5732ZM22.0371 13.0617C21.6671 13.0618 21.354 13.1542 21.1035 13.3332C20.8587 13.5122 20.7334 13.7375 20.7334 14.009C20.7335 14.2515 20.8473 14.4768 21.0352 14.6154C21.2402 14.7771 21.4908 14.8634 21.7471 14.8576C22.1341 14.8576 22.504 14.702 22.7773 14.425C23.0791 14.1362 23.2333 13.7952 23.2334 13.4025C22.9486 13.1714 22.5497 13.0559 22.0371 13.0617ZM16.0586 11.7033H17.5957C17.9374 11.7149 18.2685 11.5767 18.502 11.3283C18.9802 10.8257 18.9681 10.0166 18.4727 9.53142C18.2392 9.30054 17.9259 9.17302 17.5957 9.17302H16.0586V11.7033Z" fill="#3C4043"/>
      <path d="M12.8936 11.9579C12.8936 11.6748 12.8708 11.3917 12.8253 11.1144H8.95898V12.7146H11.174C11.0829 13.2288 10.7868 13.6909 10.354 13.9798V15.0196H11.6751C12.4495 14.2975 12.8936 13.2288 12.8936 11.9579Z" fill="#4285F4"/>
      <path d="M8.95915 16.0248C10.0638 16.0248 10.9976 15.6551 11.6752 15.0196L10.3542 13.9798C9.98408 14.234 9.51147 14.3784 8.95915 14.3784C7.88866 14.3784 6.9833 13.6447 6.65874 12.6627H5.29785V13.7372C5.99253 15.1409 7.41036 16.0248 8.95915 16.0248Z" fill="#34A853"/>
      <path d="M6.65846 12.6627C6.48761 12.1486 6.48761 11.5882 6.65846 11.0683V9.99957H5.29736C4.71078 11.1723 4.71078 12.5587 5.29736 13.7314L6.65846 12.6627Z" fill="#FBBC04"/>
      <path d="M8.95915 9.35253C9.54564 9.34098 10.1094 9.56628 10.5307 9.97643L11.7037 8.7864C10.9578 8.08162 9.97839 7.69457 8.95915 7.70612C7.41036 7.70612 5.99253 8.59576 5.29785 9.99954L6.65874 11.074C6.9833 10.0862 7.88866 9.35253 8.95915 9.35253Z" fill="#EA4335"/>
    </svg>
  )
  if (brand === 'paypal' || method === 'paypal') return (
    <svg width="51" height="36" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F5F5F5"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M14.614 18.4482L14.8347 16.9991L14.3431 16.9873H11.9951L13.6268 6.29364C13.6319 6.26126 13.6484 6.2312 13.6724 6.20981C13.6965 6.18843 13.7272 6.1767 13.7594 6.1767H17.7184C19.0328 6.1767 19.9398 6.45933 20.4133 7.01727C20.6353 7.27902 20.7767 7.55261 20.8452 7.85357C20.9169 8.16945 20.9181 8.54679 20.8481 9.00709L20.843 9.04057V9.33555L21.0651 9.46557C21.252 9.56809 21.4006 9.6854 21.5145 9.81969C21.7044 10.0435 21.8272 10.328 21.8791 10.6652C21.9328 11.0119 21.9151 11.4247 21.8272 11.892C21.7259 12.4294 21.5622 12.8975 21.341 13.2805C21.1376 13.6334 20.8785 13.9262 20.5708 14.153C20.277 14.3685 19.928 14.5321 19.5333 14.6368C19.1509 14.7397 18.7149 14.7917 18.2367 14.7917H17.9286C17.7083 14.7917 17.4943 14.8737 17.3263 15.0207C17.1579 15.1707 17.0465 15.3758 17.0123 15.6L16.989 15.7305L16.599 18.2847L16.5814 18.3784C16.5767 18.4081 16.5686 18.4229 16.5568 18.4329C16.5463 18.4421 16.5311 18.4482 16.5164 18.4482H14.614" fill="#28356A"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M21.2761 9.07465C21.2644 9.15273 21.2508 9.23252 21.2356 9.31451C20.7136 12.0852 18.9273 13.0423 16.646 13.0423H15.4845C15.2055 13.0423 14.9703 13.2516 14.9269 13.5361L14.1638 18.5394C14.1356 18.7262 14.2748 18.8945 14.4571 18.8945H16.5173C16.7612 18.8945 16.9684 18.7113 17.0069 18.4626L17.0271 18.3545L17.415 15.8103L17.4399 15.6707C17.4779 15.4212 17.6856 15.2379 17.9295 15.2379H18.2376C20.2336 15.2379 21.7961 14.4004 22.2528 11.9765C22.4435 10.964 22.3448 10.1186 21.84 9.52396C21.6873 9.3447 21.4977 9.19586 21.2761 9.07465" fill="#298FC2"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M20.7298 8.84962C20.65 8.82555 20.5677 8.8038 20.4833 8.78413C20.3984 8.76494 20.3115 8.74796 20.222 8.73305C19.9089 8.68075 19.5656 8.65594 19.1981 8.65594H16.0951C16.0186 8.65594 15.946 8.67379 15.8811 8.70604C15.7379 8.77716 15.6316 8.9172 15.6058 9.08864L14.9457 13.4102L14.9268 13.5362C14.9701 13.2517 15.2053 13.0424 15.4843 13.0424H16.6459C18.9271 13.0424 20.7134 12.0847 21.2354 9.31457C21.2511 9.23258 21.2642 9.15279 21.2759 9.07471C21.1438 9.00224 21.0008 8.94029 20.8467 8.8875C20.8087 8.87443 20.7694 8.86184 20.7298 8.84962" fill="#22284F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M15.6056 9.08862C15.6314 8.91718 15.7377 8.77715 15.8809 8.70652C15.9462 8.67414 16.0184 8.6563 16.0948 8.6563H19.1979C19.5654 8.6563 19.9086 8.68123 20.2218 8.73353C20.3113 8.74831 20.3982 8.76542 20.4831 8.7846C20.5675 8.80415 20.6498 8.82603 20.7296 8.84998C20.7692 8.8622 20.8085 8.8749 20.8469 8.88749C21.0009 8.94028 21.1441 9.00272 21.2761 9.07469C21.4315 8.05082 21.2748 7.3537 20.7393 6.72245C20.1488 6.0274 19.0831 5.72998 17.7194 5.72998H13.7603C13.4817 5.72998 13.2441 5.9393 13.2011 6.22426L11.5521 17.0279C11.5196 17.2416 11.679 17.4344 11.8876 17.4344H14.3318L15.6056 9.08862" fill="#28356A"/>
    </svg>
  )
  if (method === 'pix') return (
    <svg width="51" height="36" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
      <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F5F5F5"/>
      <rect x="4" y="7" width="27" height="10" fill="url(#pix-pattern)"/>
      <defs>
        <pattern id="pix-pattern" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use href="#pix-image" transform="matrix(0.00335648 0 0 0.00916666 -0.037037 -1)"/>
        </pattern>
        <image id="pix-image" width="320" height="320" preserveAspectRatio="none" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFACAYAAADNkKWqAAAQAElEQVR4AeydC3wU1dn/z5ndXCAJSr3XW1vftur7KqCtbT/1b4sJeHm1lgQjKoqEhIBQrNZqa7WieClapdpqxZAglKqNEES8QgC19bXVIgH9+La1vlprra0XREDIZeb8f88kGzYhCXuZ3czM/pJ59sycmTnneb7nzG/PzOzOWop/JEACJJCjBCiAOdrwDJsESEApCiB7AQmQQM4SyGkBzNlWZ+AkQAIuAQqgi4EvJEACuUiAApiLrc6YSYAEXAIUQBdDDr4wZBIgAd4EYR8gARLIXQIcAeZu2zNyEsh5AhTAnO8CuQiAMZNAJwEKYCcHvpIACeQgAQpgDjY6QyYBEugkQAHs5MBXEsgVAowzjgAFMA4GZ0mABHKLAAUwt9qb0ZIACfQmQAHsTYTLJEACOUMgpwQwZ1qVgZIACSREgAKYECZuRAIkEEYCFMAwtipjIgESSIgABTAhTCHYiCGQAAnsRoACuBsSZpAACeQKAQpgrrQ04yQBEtiNAAVwNyTMCB8BRkQCfROgAPbNhbkkQAI5QIACmAONzBBJgAT6JkAB7JsLc0kgLAQYxwAEKIADwOEqEiCBcBOgAIa7fRkdCZDAAAQogAPA4SoSIIFgE9iT9xTAPRHiehIggdASoACGtmkZGAmQwJ4IUAD3RIjrSYAEQksg1AIY2lZjYCRAAp4QoAB6gpGFkAAJBJEABTCIrUafSYAEPCFAAfQEow8LoUskQAJ7JEAB3CMibkACJBBWAhTAsLYs4yIBEtgjAQrgHhFxg+ARoMckkBgBCmBinLgVCZBACAlQAEPYqAyJBEggMQIUwMQ4cSsSCAoB+pkEAQpgErC4KQmQQLgIUADD1Z6MhgRIIAkCFMAkYHFTEiABfxNI1jsKYLLEuD0JkEBgCVAAQ9OUDIQESCBZAhTAZIlxexIggdAQCJUAhqZVGAgJkEBWCFAAs4KZlZAACfiRAAXQj61Cn0iABLJCgAKYFcxZqIRVkAAJJE2AApiUrh3YgARIIAsEKIBZgMwqSIAEgkiAAhhEq9FnEiABTwhQAD3B6INC6BIJkMAeCVAA94iIG5AACYSVAAUwrC3LuEiABPZIgAK4R0TcIHgE6DEJJEaAApgYJ25FAiQQQgIUwBA2KkMiARJIjAAFMDFO3IoEgkKAfSYBCmASsLgpCZBAuAhQAMPVnoyGBEggCQIUwCRgcVMSIAF/E0jWOwpgssS4PQmQQGAJUABD05QMhARIIFkCFMBkiXF7EiCB0BColAKYGDVuRAIk4AsCFEBfNAOdIAEQwJEe+QABYuBfzFzfKgAAAABJRU5ErkJggg=="/>
      </defs>
    </svg>
  )
  return (
    <div className="w-[51px] h-9 rounded border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
      <IconCreditCard className="size-3.5 text-muted-foreground" />
    </div>
  )
}

function paymentLabel(method: string | null, brand: string | null): string {
  const brands: Record<string, string> = {
    visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo',
    amex: 'American Express', hipercard: 'Hipercard',
  }
  const b = brand ? (brands[brand] ?? '') : ''
  if (method === 'pix')        return 'Pix'
  if (method === 'google_pay' || brand === 'google_pay') return 'Google Pay'
  if (method === 'paypal'     || brand === 'paypal')     return 'PayPal'
  if (method === 'credit') return `Crédito${b ? ` ${b}` : ''}`
  if (method === 'debit')  return `Débito${b ? ` ${b}` : ''}`
  return 'Consulta'
}

function paymentSubtitle(method: string | null, brand: string | null): string {
  if (method === 'pix')        return 'Transferência instantânea'
  if (method === 'google_pay' || brand === 'google_pay') return 'Carteira digital'
  if (method === 'paypal'     || brand === 'paypal')     return 'Carteira digital'
  if (method === 'credit') return 'Cartão de crédito'
  if (method === 'debit')  return 'Cartão de débito'
  return 'Método não informado'
}

// ─── tab content ─────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  price: number
  status: string
  created_at: string
  payment_method: string | null
  card_brand: string | null
}

function MetricasTab({
  gmv, revenue, count, avg,
  chartData, lastTransactions, blocks, tenantType,
}: {
  gmv: number
  revenue: number
  count: number
  avg: number
  chartData: { month: string; gmvClinico: number; gmvFarmacia: number; receitaNoun: number }[]
  lastTransactions: Transaction[]
  blocks: BlocksData
  tenantType: 'specialist' | 'pharmacy'
}) {
  const dtFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="GMV acumulado"       value={brl.format(gmv)}     description="Soma de consultas concluídas" />
        <StatsCard title="Receita Noun"         value={brl.format(revenue)} description="Repasses acumulados" />
        <StatsCard title="Consultas concluídas" value={count}               description="Consultas com status concluído" />
        <StatsCard title="Ticket médio"         value={brl.format(avg)}     description="Valor médio por consulta" />
      </div>

      {/* Evolução de GMV e Receita + Últimas transações 2:1 */}
      <div className="grid grid-cols-5 gap-4 items-stretch">
        <TenantRevenueChart data={chartData} tenantType={tenantType} className="col-span-3" />

        <Card className="col-span-2 flex flex-col">
          <CardHeader className="py-4 border-b shrink-0">
            <CardTitle className="text-base">Últimas transações</CardTitle>
            <CardDescription>Consultas e pedidos mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0 p-0">
            {lastTransactions.length === 0 ? (
              <TransactionsEmpty />
            ) : (
              <div>
                {lastTransactions.map((tx, index) => (
                  <Fragment key={tx.id}>
                    {index > 0 && <div className="mx-6 border-t border-border" />}
                    <div className="px-6 py-3 flex items-center gap-3">
                      <PaymentIcon method={tx.payment_method} brand={tx.card_brand} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{paymentLabel(tx.payment_method, tx.card_brand)}</p>
                        <p className="text-xs text-muted-foreground">{paymentSubtitle(tx.payment_method, tx.card_brand)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">+ {brl.format(tx.price)}</p>
                        <p className="text-xs text-muted-foreground">{dtFmt.format(new Date(tx.created_at))}</p>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Blocks: Crescimento, Funil/Farmácia, Financeiro avançado */}
      <TenantMetricasBlocks data={blocks} tenantType={tenantType} />
    </div>
  )
}

function GestaoTab({ tenantId, currentStatus }: { tenantId: string; currentStatus: string }) {
  return <TenantGestaoZones tenantId={tenantId} currentStatus={currentStatus} />
}

// ─── page ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: 'detalhes', label: 'Detalhes' },
  { key: 'metricas', label: 'Métricas' },
  { key: 'gestao',   label: 'Gestão'   },
]

export default async function TenantDetailPage({ params, searchParams }: PageProps) {
  const { id }               = await params
  const { tab = 'detalhes' } = await searchParams

  const { profile, session } = await requireAdmin()
  const adminName = profile.full_name ?? profile.email ?? session.user.email ?? 'Admin'

  const supabase = await createSupabaseServer()

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!tenantData) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant = tenantData as any
  const tenantType: 'specialist' | 'pharmacy' = tenant.type === 'pharmacy' ? 'pharmacy' : 'specialist'

  const [
    appointmentsRes,
    earningsRes,
    chartRes,
    txRes,
    blocksRes,
  ] = await Promise.all([
    supabase.from('appointments').select('price').eq('tenant_id', id).eq('status', 'completed'),
    supabase.from('professional_earnings').select('noun_fee').eq('tenant_id', id),
    supabase.rpc('get_tenant_monthly_chart_data', { p_tenant_id: id }),
    supabase.rpc('get_tenant_last_transactions',  { p_tenant_id: id }),
    supabase.rpc('get_tenant_blocks_data', { p_tenant_id: id }),
  ])

  const gmvTotal          = (appointmentsRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const nounRevenue       = (earningsRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0)
  const appointmentsCount = appointmentsRes.data?.length ?? 0
  const avgTicket         = appointmentsCount > 0 ? gmvTotal / appointmentsCount : 0

  const MOCK_CHART_DATA = tenantType === 'pharmacy'
    ? [
        { month: 'Jan', gmvClinico: 0, gmvFarmacia: 6200,  receitaNoun: 620  },
        { month: 'Fev', gmvClinico: 0, gmvFarmacia: 7400,  receitaNoun: 740  },
        { month: 'Mar', gmvClinico: 0, gmvFarmacia: 6800,  receitaNoun: 680  },
        { month: 'Abr', gmvClinico: 0, gmvFarmacia: 9100,  receitaNoun: 910  },
        { month: 'Mai', gmvClinico: 0, gmvFarmacia: 8300,  receitaNoun: 830  },
        { month: 'Jun', gmvClinico: 0, gmvFarmacia: 10600, receitaNoun: 1060 },
      ]
    : [
        { month: 'Jan', gmvClinico: 8400,  gmvFarmacia: 0, receitaNoun: 840  },
        { month: 'Fev', gmvClinico: 10200, gmvFarmacia: 0, receitaNoun: 1020 },
        { month: 'Mar', gmvClinico: 9600,  gmvFarmacia: 0, receitaNoun: 960  },
        { month: 'Abr', gmvClinico: 12800, gmvFarmacia: 0, receitaNoun: 1280 },
        { month: 'Mai', gmvClinico: 11400, gmvFarmacia: 0, receitaNoun: 1140 },
        { month: 'Jun', gmvClinico: 14200, gmvFarmacia: 0, receitaNoun: 1420 },
      ]

  const rawChartData = (chartRes.data ?? []).map((row: {
    month_num: number; year_num: number;
    gmv_clinico: number; gmv_farmacia: number; receita_noun: number
  }) => ({
    month:       MONTH_NAMES[(row.month_num - 1) % 12],
    gmvClinico:  Number(row.gmv_clinico),
    gmvFarmacia: Number(row.gmv_farmacia),
    receitaNoun: Number(row.receita_noun),
  }))
  const hasChartData = rawChartData.some((r: { gmvClinico: number; gmvFarmacia: number; receitaNoun: number }) => r.gmvClinico > 0 || r.gmvFarmacia > 0 || r.receitaNoun > 0)
  const chartData = hasChartData ? rawChartData : MOCK_CHART_DATA

  const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'a1b2c3d4-0000-0000-0000-000000000001', price: 320, status: 'completed', created_at: '2026-06-18T14:32:00Z', payment_method: 'pix',        card_brand: null },
    { id: 'a1b2c3d4-0000-0000-0000-000000000002', price: 180, status: 'completed', created_at: '2026-06-17T10:15:00Z', payment_method: 'credit',      card_brand: 'visa' },
    { id: 'a1b2c3d4-0000-0000-0000-000000000003', price: 250, status: 'completed', created_at: '2026-06-16T09:00:00Z', payment_method: 'debit',       card_brand: 'mastercard' },
    { id: 'a1b2c3d4-0000-0000-0000-000000000004', price: 450, status: 'completed', created_at: '2026-06-15T11:00:00Z', payment_method: 'google_pay',  card_brand: null },
    { id: 'a1b2c3d4-0000-0000-0000-000000000005', price: 190, status: 'completed', created_at: '2026-06-14T16:45:00Z', payment_method: 'paypal',      card_brand: null },
    { id: 'a1b2c3d4-0000-0000-0000-000000000006', price: 310, status: 'completed', created_at: '2026-06-13T08:30:00Z', payment_method: 'credit',      card_brand: 'elo' },
  ]

  const rawTx = (txRes.data ?? []).map((row: {
    id: string; price: number; status: string; created_at: string
    payment_method: string | null; card_brand: string | null
  }) => ({
    id:             row.id,
    price:          Number(row.price),
    status:         row.status,
    created_at:     row.created_at,
    payment_method: row.payment_method,
    card_brand:     row.card_brand,
  }))
  const lastTransactions: Transaction[] = rawTx.length > 0 ? rawTx : MOCK_TRANSACTIONS

  const blocks: BlocksData = (blocksRes.data as BlocksData | null) ?? EMPTY_BLOCKS

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
          <span>{tenant.code}</span>
          {tenant.razao_social && (
            <>
              <span>·</span>
              <span>{tenant.razao_social}</span>
            </>
          )}
          <span>·</span>
          <span>{statusLabel(tenant.status)}</span>
          {tenant.subtype && (
            <>
              <span>·</span>
              <span>{SUBTYPE_LABELS[tenant.subtype] ?? tenant.subtype}</span>
            </>
          )}
        </div>
        <h1 className="text-xl font-semibold">{tenant.name}</h1>
      </div>

      {/* Tab line */}
      <div className="flex gap-6 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/tenants/${id}?tab=${t.key}`}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {tab === 'detalhes' && (
        <NovoTenantForm
          adminName={adminName}
          initialData={tenant as unknown as TenantEditData}
          noPadding
        />
      )}
      {tab === 'metricas' && (
        <MetricasTab
          gmv={gmvTotal}
          revenue={nounRevenue}
          count={appointmentsCount}
          avg={avgTicket}
          chartData={chartData}
          lastTransactions={lastTransactions}
          blocks={blocks}
          tenantType={tenantType}
        />
      )}
      {tab === 'gestao' && <GestaoTab tenantId={id} currentStatus={tenant.status} />}
    </div>
  )
}
