'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, type UseFormReturn, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Alert, AlertTitle, AlertDescription, AlertActions, AlertClose } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { IconAlertCircle, IconCheck, IconSelector } from '@tabler/icons-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatCRM, formatCRP, formatCRN, formatCRF, formatRQE } from '@/lib/formatters'
import { atualizarTenant } from '../[id]/actions'

// ─── Constantes ────────────────────────────────────────────────────────────────

const TENANT_TYPES = [
  { value: 'specialist', label: 'Especialista' },
  { value: 'pharmacy',   label: 'Farmácia'     },
]

const SPECIALIST_SUBTYPES = [
  { value: 'clinico_geral',    label: 'Clínico Geral'    },
  { value: 'endocrinologista', label: 'Endocrinologista' },
  { value: 'urologista',       label: 'Urologista'       },
  { value: 'ginecologista',    label: 'Ginecologista'    },
  { value: 'psiquiatra',       label: 'Psiquiatra'       },
  { value: 'psicologo',        label: 'Psicólogo(a)'     },
  { value: 'nutricionista',    label: 'Nutricionista'    },
]

const PHARMACY_SUBTYPES = [
  { value: 'rede',         label: 'Farmácia de Rede'        },
  { value: 'manipulacao',  label: 'Farmácia de Manipulação'  },
]

const REGIME_TRIBUTARIO = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'lucro_presumido',  label: 'Lucro Presumido'  },
  { value: 'lucro_real',       label: 'Lucro Real'       },
  { value: 'mei',              label: 'MEI'              },
]

const BANCOS = [
  { value: '001', label: 'Banco do Brasil (001)' },
  { value: '003', label: 'Banco da Amazônia (003)' },
  { value: '004', label: 'Banco do Nordeste (004)' },
  { value: '010', label: 'Credicoamo (010)' },
  { value: '012', label: 'Banco Inbursa (012)' },
  { value: '014', label: 'State Street Brasil (014)' },
  { value: '021', label: 'Banestes (021)' },
  { value: '024', label: 'Banco Bandepe (024)' },
  { value: '025', label: 'Banco Alfa (025)' },
  { value: '029', label: 'Banco Itaú Consignado (029)' },
  { value: '033', label: 'Santander (033)' },
  { value: '036', label: 'Banco Bradesco BBI (036)' },
  { value: '037', label: 'Banco do Estado do Pará (037)' },
  { value: '040', label: 'Banco Cargill (040)' },
  { value: '041', label: 'Banrisul (041)' },
  { value: '047', label: 'Banco do Estado de Sergipe (047)' },
  { value: '060', label: 'Confidence Câmbio (060)' },
  { value: '062', label: 'Hipercard (062)' },
  { value: '063', label: 'Banco Bradescard (063)' },
  { value: '065', label: 'Banco AndBank (065)' },
  { value: '066', label: 'Banco Morgan Stanley (066)' },
  { value: '069', label: 'Banco Crefisa (069)' },
  { value: '070', label: 'BRB (070)' },
  { value: '074', label: 'Banco J. Safra (074)' },
  { value: '075', label: 'Banco ABN Amro (075)' },
  { value: '076', label: 'Banco KDB do Brasil (076)' },
  { value: '077', label: 'Inter (077)' },
  { value: '079', label: 'Banco Original do Agronegócio (079)' },
  { value: '080', label: 'B&T Câmbio (080)' },
  { value: '081', label: 'BancoSeguro (081)' },
  { value: '082', label: 'Banco Topázio (082)' },
  { value: '083', label: 'Banco da China Brasil (083)' },
  { value: '084', label: 'Uniprime Norte do Paraná (084)' },
  { value: '085', label: 'Cooperativa Central Ailos (085)' },
  { value: '089', label: 'Cooperativa Central Credisan (089)' },
  { value: '091', label: 'Unicred Central RS (091)' },
  { value: '092', label: 'BRK Financeira (092)' },
  { value: '093', label: 'PóloCred (093)' },
  { value: '094', label: 'Banco Finaxis (094)' },
  { value: '095', label: 'Travelex Banco de Câmbio (095)' },
  { value: '096', label: 'Banco B3 (096)' },
  { value: '097', label: 'Cooperativa Central Credisis (097)' },
  { value: '098', label: 'Credialiança (098)' },
  { value: '099', label: 'Uniprime Central (099)' },
  { value: '100', label: 'Planner (100)' },
  { value: '101', label: 'Renascença DTVM (101)' },
  { value: '102', label: 'XP Investimentos (102)' },
  { value: '104', label: 'Caixa Econômica Federal (104)' },
  { value: '105', label: 'Lecca (105)' },
  { value: '107', label: 'Banco Bocom BBM (107)' },
  { value: '108', label: 'PortoCred (108)' },
  { value: '111', label: 'Banco Oliveira Trust (111)' },
  { value: '113', label: 'Neon/Magliano (113)' },
  { value: '114', label: 'Central Cooperativa Cecred (114)' },
  { value: '117', label: 'Advanced (117)' },
  { value: '119', label: 'Banco Western Union (119)' },
  { value: '120', label: 'Banco Rodobens (120)' },
  { value: '121', label: 'Banco Agibank (121)' },
  { value: '122', label: 'Banco Bradesco BERJ (122)' },
  { value: '124', label: 'Banco Woori Bank (124)' },
  { value: '125', label: 'Banco Genial (125)' },
  { value: '126', label: 'BR Partners (126)' },
  { value: '127', label: 'Codepe (127)' },
  { value: '128', label: 'MS Bank (128)' },
  { value: '129', label: 'UBS Brasil (129)' },
  { value: '130', label: 'Caruana (130)' },
  { value: '131', label: 'Tullett Prebon (131)' },
  { value: '132', label: 'ICBC do Brasil (132)' },
  { value: '133', label: 'Cresol Confederação (133)' },
  { value: '134', label: 'BGC Liquidez (134)' },
  { value: '136', label: 'Unicred (136)' },
  { value: '138', label: 'Get Money (138)' },
  { value: '139', label: 'Intesa Sanpaolo Brasil (139)' },
  { value: '140', label: 'Easynvest (140)' },
  { value: '142', label: 'Broker Brasil (142)' },
  { value: '143', label: 'Treviso (143)' },
  { value: '144', label: 'Bexs Banco de Câmbio (144)' },
  { value: '145', label: 'Goldman Sachs do Brasil (145)' },
  { value: '146', label: 'Guitta (146)' },
  { value: '149', label: 'Facta Financeira (149)' },
  { value: '157', label: 'ICAP do Brasil (157)' },
  { value: '159', label: 'Casa do Crédito (159)' },
  { value: '163', label: 'Commerzbank Brasil (163)' },
  { value: '169', label: 'Banco Olé Bonsucesso Consignado (169)' },
  { value: '173', label: 'BRL Trust DTVM (173)' },
  { value: '174', label: 'Pefisa (174)' },
  { value: '177', label: 'Guide Investimentos (177)' },
  { value: '180', label: 'CM Capital Markets (180)' },
  { value: '183', label: 'Socred (183)' },
  { value: '184', label: 'Banco Itaú BBA (184)' },
  { value: '188', label: 'Ativa Investimentos (188)' },
  { value: '189', label: 'HS Financeira (189)' },
  { value: '190', label: 'Cooperativa de Economia Servicopa (190)' },
  { value: '191', label: 'Nova Futura (191)' },
  { value: '194', label: 'Parmetal DTVM (194)' },
  { value: '196', label: 'Fair (196)' },
  { value: '197', label: 'Stone Pagamentos (197)' },
  { value: '208', label: 'BTG Pactual (208)' },
  { value: '212', label: 'Banco Original (212)' },
  { value: '213', label: 'Banco Arbi (213)' },
  { value: '217', label: 'Banco John Deere (217)' },
  { value: '218', label: 'Banco BS2 (218)' },
  { value: '222', label: 'Banco Credit Agricole (222)' },
  { value: '224', label: 'Banco Fibra (224)' },
  { value: '233', label: 'Banco Cifra (233)' },
  { value: '237', label: 'Bradesco (237)' },
  { value: '241', label: 'Banco Clássico (241)' },
  { value: '243', label: 'Banco Máxima (243)' },
  { value: '246', label: 'Banco ABC Brasil (246)' },
  { value: '249', label: 'Banco Investcred Unibanco (249)' },
  { value: '250', label: 'BCV Banco de Crédito e Varejo (250)' },
  { value: '253', label: 'Bexs Corretora (253)' },
  { value: '254', label: 'Paraná Banco (254)' },
  { value: '260', label: 'Nubank (260)' },
  { value: '265', label: 'Banco Fator (265)' },
  { value: '266', label: 'Banco Cédula (266)' },
  { value: '268', label: 'Barigui (268)' },
  { value: '269', label: 'HSBC Brasil (269)' },
  { value: '270', label: 'Sagitur (270)' },
  { value: '271', label: 'IB Cctvm (271)' },
  { value: '272', label: 'AGK (272)' },
  { value: '273', label: 'Cooperativa Central Cecresp (273)' },
  { value: '274', label: 'Money Plus (274)' },
  { value: '276', label: 'Banco Senff (276)' },
  { value: '278', label: 'Genial Investimentos (278)' },
  { value: '279', label: 'Cooperativa Central Primacredi (279)' },
  { value: '280', label: 'Avista (280)' },
  { value: '281', label: 'Cooperativa Central Coopnore (281)' },
  { value: '283', label: 'RB Investimentos (283)' },
  { value: '285', label: 'Frente (285)' },
  { value: '286', label: 'Cooperativa Central Uniprime (286)' },
  { value: '288', label: 'Carol DTVM (288)' },
  { value: '289', label: 'Decyseo (289)' },
  { value: '290', label: 'PagSeguro (290)' },
  { value: '292', label: 'BS2 DTVM (292)' },
  { value: '293', label: 'Lastro RDV (293)' },
  { value: '296', label: 'Banco OZK (296)' },
  { value: '299', label: 'Sorocred (299)' },
  { value: '300', label: 'Banco de La Nacion Argentina (300)' },
  { value: '301', label: 'BPP Instituição de Pagamento (301)' },
  { value: '306', label: 'Portopar DTVM (306)' },
  { value: '307', label: 'Terra Investimentos (307)' },
  { value: '309', label: 'Cambionet (309)' },
  { value: '310', label: 'Vortx DTVM (310)' },
  { value: '311', label: 'Dourada (311)' },
  { value: '312', label: 'Hscm (312)' },
  { value: '313', label: 'Amazônia (313)' },
  { value: '315', label: 'PI DTVM (315)' },
  { value: '318', label: 'Banco BMG (318)' },
  { value: '319', label: 'OM DTVM (319)' },
  { value: '320', label: 'Banco CCB Brasil (320)' },
  { value: '321', label: 'Crefaz (321)' },
  { value: '322', label: 'Cooperativa Central Credifoz (322)' },
  { value: '323', label: 'Mercado Pago (323)' },
  { value: '325', label: 'Órama (325)' },
  { value: '329', label: 'QI SCD (329)' },
  { value: '330', label: 'Banco Bari (330)' },
  { value: '331', label: 'Fram Capital (331)' },
  { value: '332', label: 'Acesso Soluções de Pagamento (332)' },
  { value: '335', label: 'Banco Digio (335)' },
  { value: '336', label: 'Banco C6 (336)' },
  { value: '340', label: 'Super Pagamentos (340)' },
  { value: '341', label: 'Itaú Unibanco (341)' },
  { value: '342', label: 'Creditas (342)' },
  { value: '343', label: 'FFA (343)' },
  { value: '348', label: 'Banco XP (348)' },
  { value: '349', label: 'Amaggi (349)' },
  { value: '352', label: 'Toro Investimentos (352)' },
  { value: '354', label: 'Necton Investimentos (354)' },
  { value: '355', label: 'Ótimo (355)' },
  { value: '358', label: 'Midway (358)' },
  { value: '359', label: 'Zema (359)' },
  { value: '360', label: 'Trinus Capital (360)' },
  { value: '362', label: 'Cielo (362)' },
  { value: '363', label: 'Singulare (363)' },
  { value: '364', label: 'Gerencianet/Efí (364)' },
  { value: '365', label: 'Solidus (365)' },
  { value: '366', label: 'Banco Société Générale (366)' },
  { value: '367', label: 'Vitreo (367)' },
  { value: '368', label: 'Banco CSF (368)' },
  { value: '370', label: 'Banco Mizuho (370)' },
  { value: '371', label: 'Warren (371)' },
  { value: '373', label: 'UP.P (373)' },
  { value: '374', label: 'Realize (374)' },
  { value: '376', label: 'Banco J. P. Morgan (376)' },
  { value: '377', label: 'BMS (377)' },
  { value: '378', label: 'BBC Leasing (378)' },
  { value: '379', label: 'Cooperforte (379)' },
  { value: '380', label: 'PicPay (380)' },
  { value: '381', label: 'Banco Mercedes-Benz (381)' },
  { value: '382', label: 'Fiducia (382)' },
  { value: '383', label: 'Juno (383)' },
  { value: '384', label: 'Global SCM (384)' },
  { value: '385', label: 'Cooperativa Central Cecoop (385)' },
  { value: '386', label: 'Nu Financeira (386)' },
  { value: '387', label: 'Banco Toyota (387)' },
  { value: '389', label: 'Mercantil do Brasil (389)' },
  { value: '390', label: 'Banco GM (390)' },
  { value: '391', label: 'Cooperativa Central Coopcentral (391)' },
  { value: '393', label: 'Banco Volkswagen (393)' },
  { value: '394', label: 'Banco Bradesco Financiamentos (394)' },
  { value: '396', label: 'Hub Pagamentos (396)' },
  { value: '399', label: 'Kirton Bank (399)' },
  { value: '400', label: 'Cooperativa Central Sicredi (400)' },
  { value: '401', label: 'Iugu (401)' },
  { value: '403', label: 'Cora (403)' },
  { value: '404', label: 'Sumup (404)' },
  { value: '406', label: 'Accredito (406)' },
  { value: '407', label: 'Banco Invert (407)' },
  { value: '408', label: 'Bonuspago (408)' },
  { value: '410', label: 'Planner Sociedade de Crédito (410)' },
  { value: '411', label: 'Via Certa Financiadora (411)' },
  { value: '412', label: 'Banco Capital (412)' },
  { value: '413', label: 'Banco BV (413)' },
  { value: '414', label: 'Lend (414)' },
  { value: '416', label: 'Lamara (416)' },
  { value: '418', label: 'Zipdin (418)' },
  { value: '419', label: 'Banco Pan (419)' },
  { value: '421', label: 'LAR Cooperativa (421)' },
  { value: '422', label: 'Safra (422)' },
  { value: '423', label: 'Coluna (423)' },
  { value: '425', label: 'Banco Toro (425)' },
  { value: '427', label: 'Cred-Coopersystem (427)' },
  { value: '428', label: 'Cred-System (428)' },
  { value: '429', label: 'Crediare (429)' },
  { value: '430', label: 'Cooperativa Central Sicoob NE (430)' },
  { value: '433', label: 'BR-Capital DTVM (433)' },
  { value: '435', label: 'Delcred (435)' },
  { value: '438', label: 'Inecobank (438)' },
  { value: '439', label: 'ID CTVM (439)' },
  { value: '440', label: 'Credibrf (440)' },
  { value: '442', label: 'Magnetis (442)' },
  { value: '443', label: 'Banco Itaú Veículos (443)' },
  { value: '444', label: 'Trinus SCD (444)' },
  { value: '445', label: 'Plantae (445)' },
  { value: '450', label: 'Fitbank (450)' },
  { value: '452', label: 'Credifit (452)' },
  { value: '454', label: 'Banco Mérito (454)' },
  { value: '456', label: 'Banco MUFG (456)' },
  { value: '461', label: 'Asaas (461)' },
  { value: '464', label: 'Banco Sumitomo Mitsui (464)' },
  { value: '473', label: 'Banco Caixa Geral (473)' },
  { value: '477', label: 'Citibank (477)' },
  { value: '479', label: 'Banco ItauBank (479)' },
  { value: '487', label: 'Deutsche Bank (487)' },
  { value: '488', label: 'JPMorgan Chase Bank (488)' },
  { value: '492', label: 'ING Bank (492)' },
  { value: '495', label: 'Banco de La Provincia de Buenos Aires (495)' },
  { value: '505', label: 'Banco Credit Suisse (505)' },
  { value: '545', label: 'Senso (545)' },
  { value: '600', label: 'Banco Luso Brasileiro (600)' },
  { value: '604', label: 'Banco Industrial do Brasil (604)' },
  { value: '610', label: 'Banco VR (610)' },
  { value: '611', label: 'Banco Paulista (611)' },
  { value: '612', label: 'Banco Guanabara (612)' },
  { value: '613', label: 'Omni Banco (613)' },
  { value: '623', label: 'Banco Pan II (623)' },
  { value: '626', label: 'Banco Ficsa (626)' },
  { value: '630', label: 'Banco Smartbank (630)' },
  { value: '633', label: 'Banco Rendimento (633)' },
  { value: '634', label: 'Banco Triângulo (634)' },
  { value: '637', label: 'Banco Sofisa (637)' },
  { value: '643', label: 'Banco Pine (643)' },
  { value: '652', label: 'Itaú Unibanco Holding (652)' },
  { value: '653', label: 'Banco Indusval (653)' },
  { value: '654', label: 'Banco Digimais (654)' },
  { value: '655', label: 'Banco Votorantim (655)' },
  { value: '707', label: 'Banco Daycoval (707)' },
  { value: '712', label: 'Banco Ourinvest (712)' },
  { value: '739', label: 'Banco Cetelem (739)' },
  { value: '741', label: 'Banco Ribeirão Preto (741)' },
  { value: '743', label: 'Banco Semear (743)' },
  { value: '745', label: 'Banco Citibank (745)' },
  { value: '746', label: 'Banco Modal (746)' },
  { value: '747', label: 'Banco Rabobank (747)' },
  { value: '748', label: 'Sicredi (748)' },
  { value: '751', label: 'Scotiabank Brasil (751)' },
  { value: '752', label: 'Banco BNP Paribas (752)' },
  { value: '753', label: 'Novo Banco Continental (753)' },
  { value: '754', label: 'Banco Sistema (754)' },
  { value: '755', label: 'Bank of America Merrill Lynch (755)' },
  { value: '756', label: 'Sicoob (756)' },
  { value: '757', label: 'Banco KEB Hana (757)' },
  { value: 'outro', label: 'Outro' },
]

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const PIX_TIPOS = [
  { value: 'cpf',       label: 'CPF'             },
  { value: 'cnpj',      label: 'CNPJ'            },
  { value: 'email',     label: 'E-mail'          },
  { value: 'telefone',  label: 'Telefone'        },
  { value: 'aleatoria', label: 'Chave aleatória' },
]

// ─── Helpers de conselho ───────────────────────────────────────────────────────

function getConselhoTipo(subtype: string): 'CRM' | 'CRP' | 'CRN' | null {
  if (['clinico_geral','endocrinologista','urologista','ginecologista','psiquiatra'].includes(subtype)) return 'CRM'
  if (subtype === 'psicologo') return 'CRP'
  if (subtype === 'nutricionista') return 'CRN'
  return null
}

function requiresRQE(subtype: string): boolean {
  return ['endocrinologista','urologista','ginecologista','psiquiatra'].includes(subtype)
}

// ─── Seções ────────────────────────────────────────────────────────────────────

type SectionKey = 'identificacao' | 'fiscal' | 'contato' | 'bancario' | 'comercial' | 'termos'

const SECTION_FIELDS: Record<SectionKey, string[]> = {
  identificacao: [
    'type', 'subtype', 'name', 'cnpj', 'razaoSocial',
    'conselhoNumero', 'conselhoUf', 'rqe',
    'responsavelTecnicoNome', 'responsavelTecnicoCrf', 'responsavelTecnicoCrfUf',
    'afeCodigo', 'aeNumero', 'alvaraSanitario',
  ],
  fiscal: [
    'fiscalType', 'cpf', 'cnpj', 'razaoSocial', 'nomeFantasia',
    'regimeTributario', 'responsavelLegalNome', 'responsavelLegalCpf', 'inscricaoEstadual',
  ],
  contato:  ['email', 'telefone', 'cep', 'logradouro', 'numeroLogradouro', 'bairro', 'cidade', 'uf'],
  bancario: ['banco', 'agencia', 'conta', 'tipoConta', 'titularNome', 'titularDocumento'],
  comercial: ['commissionRate', 'payoutDelayDays', 'commercialNotes'],
  termos:   ['termosAceitos', 'lgpdAceita'],
}

// ─── Máscaras ──────────────────────────────────────────────────────────────────

function maskCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`
}

function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (!d) return ''
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length <= 5 ? d : `${d.slice(0,5)}-${d.slice(5)}`
}

function maskDoc(v: string) {
  const d = v.replace(/\D/g, '')
  return d.length <= 11 ? maskCPF(v) : maskCNPJ(v)
}

// ─── Schema Zod ────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    // Identificação
    type:     z.string().min(1, 'Selecione o tipo'),
    subtype:  z.string(),
    name:     z.string(),

    // Specialist
    conselhoNumero: z.string(),
    conselhoUf:     z.string(),
    rqe:            z.string(),

    // Pharmacy
    responsavelTecnicoNome:   z.string(),
    responsavelTecnicoCrf:    z.string(),
    responsavelTecnicoCrfUf:  z.string(),
    afeCodigo:        z.string(),
    aeNumero:         z.string(),
    alvaraSanitario:  z.string(),

    // Fiscal
    fiscalType:           z.string(),
    cpf:                  z.string(),
    cnpj:                 z.string(),
    razaoSocial:          z.string(),
    nomeFantasia:         z.string(),
    regimeTributario:     z.string(),
    responsavelLegalNome: z.string(),
    responsavelLegalCpf:  z.string(),
    inscricaoEstadual:    z.string(),

    // Contato
    email:            z.string(),
    telefone:         z.string(),
    cep:              z.string(),
    logradouro:       z.string(),
    numeroLogradouro: z.string(),
    complemento:      z.string(),
    bairro:           z.string(),
    cidade:           z.string(),
    uf:               z.string(),

    // Bancário
    banco:            z.string(),
    agencia:          z.string(),
    conta:            z.string(),
    tipoConta:        z.string(),
    titularNome:      z.string(),
    titularDocumento: z.string(),
    pixTipo:          z.string(),
    pixValor:         z.string(),

    // Comercial
    commissionRate:   z.string(),
    payoutDelayDays:  z.string(),
    commercialNotes:  z.string(),

    // Termos
    termosAceitos: z.boolean(),
    lgpdAceita:    z.boolean(),
  })
  .superRefine((data, ctx) => {
    const t = data.type
    if (!t) return

    const req = (path: string, msg: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: [path] })
    const dig = (v?: string) => (v ?? '').replace(/\D/g, '')

    // Identificação
    if (!data.name.trim()) req('name', 'Nome de exibição é obrigatório')
    if (!data.subtype) req('subtype', 'Subtipo é obrigatório')

    if (t === 'specialist') {
      const conselho = getConselhoTipo(data.subtype)
      if (conselho) {
        if (!data.conselhoNumero.trim()) req('conselhoNumero', `Número do ${conselho} é obrigatório`)
        if (!data.conselhoUf) req('conselhoUf', `UF do ${conselho} é obrigatória`)
      }
      if (requiresRQE(data.subtype) && !data.rqe.trim()) {
        req('rqe', 'RQE é obrigatório')
      }
    }

    if (t === 'pharmacy') {
      if (!data.responsavelTecnicoNome.trim()) req('responsavelTecnicoNome', 'Nome do RT é obrigatório')
      if (!data.responsavelTecnicoCrf.trim()) req('responsavelTecnicoCrf', 'CRF do RT é obrigatório')
      if (!data.responsavelTecnicoCrfUf) req('responsavelTecnicoCrfUf', 'UF do CRF é obrigatória')
      if (data.subtype === 'manipulacao' && !data.afeCodigo.trim()) {
        req('afeCodigo', 'AFE é obrigatório para manipulação')
      }
    }

    // Fiscal
    if (t === 'pharmacy') {
      if (dig(data.cnpj).length !== 14) req('cnpj', 'CNPJ inválido')
      if (!data.razaoSocial.trim()) req('razaoSocial', 'Razão Social é obrigatória')
      if (!data.regimeTributario) req('regimeTributario', 'Regime tributário é obrigatório')
      if (!data.responsavelLegalNome.trim()) req('responsavelLegalNome', 'Nome do responsável legal é obrigatório')
      if (dig(data.responsavelLegalCpf).length !== 11) req('responsavelLegalCpf', 'CPF do responsável legal inválido')
      if (!data.inscricaoEstadual.trim()) req('inscricaoEstadual', 'Inscrição estadual é obrigatória')
    } else {
      if (!data.fiscalType) req('fiscalType', 'Tipo de faturamento é obrigatório')
      if (!data.regimeTributario) req('regimeTributario', 'Regime tributário é obrigatório')
      if (data.fiscalType === 'pf') {
        if (dig(data.cpf).length !== 11) req('cpf', 'CPF inválido')
      } else if (data.fiscalType === 'pj') {
        if (dig(data.cnpj).length !== 14) req('cnpj', 'CNPJ inválido')
        if (!data.razaoSocial.trim()) req('razaoSocial', 'Razão Social é obrigatória')
        if (!data.responsavelLegalNome.trim()) req('responsavelLegalNome', 'Nome do responsável legal é obrigatório')
        if (dig(data.responsavelLegalCpf).length !== 11) req('responsavelLegalCpf', 'CPF do responsável legal inválido')
      }
    }

    // Contato
    if (!data.email.trim())
      req('email', 'E-mail é obrigatório')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      req('email', 'E-mail inválido')
    if (dig(data.telefone).length < 10) req('telefone', 'Telefone inválido')
    if (dig(data.cep).length !== 8)     req('cep', 'CEP inválido')
    if (!data.logradouro.trim())        req('logradouro', 'Logradouro é obrigatório')
    if (!data.numeroLogradouro.trim())  req('numeroLogradouro', 'Número é obrigatório')
    if (!data.bairro.trim())            req('bairro', 'Bairro é obrigatório')
    if (!data.cidade.trim())            req('cidade', 'Cidade é obrigatória')
    if (!data.uf)                       req('uf', 'UF é obrigatória')

    // Bancário
    if (!data.banco)                req('banco', 'Banco é obrigatório')
    if (!data.agencia.trim())       req('agencia', 'Agência é obrigatória')
    if (!data.conta.trim())         req('conta', 'Conta é obrigatória')
    if (!data.tipoConta)            req('tipoConta', 'Tipo de conta é obrigatório')
    if (!data.titularNome.trim())   req('titularNome', 'Nome do titular é obrigatório')
    if (!dig(data.titularDocumento)) req('titularDocumento', 'CPF/CNPJ do titular é obrigatório')

    // Termos
    if (!data.termosAceitos) req('termosAceitos', 'Aceite os Termos de Parceria Noun')
    if (!data.lgpdAceita)    req('lgpdAceita', 'Aceite a Política de Privacidade e LGPD')
  })

type FormData = z.infer<typeof formSchema>

// ─── Componentes auxiliares ────────────────────────────────────────────────────

function SearchableSelect({
  value, onValueChange, options, placeholder, searchPlaceholder, error, className, listClassName, contentClassName,
}: {
  value: string
  onValueChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  searchPlaceholder?: string
  error?: boolean
  className?: string
  listClassName?: string
  contentClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal active:scale-100',
            !selected && 'text-muted-foreground',
            error && 'border-destructive',
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0', contentClassName ?? 'w-(--radix-popover-trigger-width)')} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder || 'Buscar...'} className="h-8 py-1" />
          <CommandList className={cn('max-h-52', listClassName)}>
            <CommandEmpty>Nenhum resultado</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => { onValueChange(o.value); setOpen(false) }}
                >
                  <IconCheck className={cn('mr-2 h-4 w-4', value === o.value ? 'opacity-100' : 'opacity-0')} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const ESTADO_OPTIONS = ESTADOS.map((uf) => ({ value: uf, label: uf }))

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pt-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

function FormRow({
  label, description, children, className, required,
}: {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
  required?: boolean
}) {
  return (
    <div className={cn('grid grid-cols-[200px_auto] items-center gap-8 py-4 px-4', className)}>
      <div className="pt-0.5">
        <p className="text-sm font-medium text-foreground">
          {label}{required && <span className="text-destructive ml-0.5">*</span>}
        </p>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="w-[280px] justify-self-end">{children}</div>
    </div>
  )
}

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null
  return <p className="text-xs text-destructive mt-1.5">{error.message}</p>
}

function RoValue({ label, value, mono }: { label?: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
      <p className={cn('text-sm', mono && 'font-mono')}>{value || '—'}</p>
    </div>
  )
}

// ─── Seção 1: Identificação ───────────────────────────────────────────────────

function IdentificacaoFields({ form }: { form: UseFormReturn<FormData> }) {
  const { control, watch, setValue, formState: { errors } } = form
  const type    = watch('type')
  const subtype = watch('subtype')

  const isSpecialist = type === 'specialist'
  const isPharmacy   = type === 'pharmacy'
  const conselho     = subtype ? getConselhoTipo(subtype) : null
  const showRQE      = subtype ? requiresRQE(subtype) : false
  const subtypeOptions = isSpecialist ? SPECIALIST_SUBTYPES : isPharmacy ? PHARMACY_SUBTYPES : []

  return (
    <>
      <FormRow label="Tipo" description="Especialista (médico, psicólogo, nutricionista) ou farmácia" required>
        <Controller name="type" control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(val) => {
              field.onChange(val)
              setValue('subtype', '', { shouldValidate: false })
              if (val === 'specialist') {
                setValue('responsavelTecnicoNome', '', { shouldValidate: false })
                setValue('responsavelTecnicoCrf', '', { shouldValidate: false })
                setValue('responsavelTecnicoCrfUf', '', { shouldValidate: false })
                setValue('afeCodigo', '', { shouldValidate: false })
                setValue('aeNumero', '', { shouldValidate: false })
                setValue('alvaraSanitario', '', { shouldValidate: false })
                setValue('inscricaoEstadual', '', { shouldValidate: false })
              } else if (val === 'pharmacy') {
                setValue('conselhoNumero', '', { shouldValidate: false })
                setValue('conselhoUf', '', { shouldValidate: false })
                setValue('rqe', '', { shouldValidate: false })
                setValue('fiscalType', 'pj', { shouldValidate: false })
              }
            }}>
              <SelectTrigger className={cn(errors.type && 'border-destructive')}>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TENANT_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError error={errors.type} />
      </FormRow>

      {type && (
        <FormRow label="Subtipo" description="Especialidade ou categoria do parceiro" required>
          <Controller name="subtype" control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => {
                field.onChange(val)
                if (!requiresRQE(val)) setValue('rqe', '', { shouldValidate: false })
              }}>
                <SelectTrigger className={cn(errors.subtype && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o subtipo..." />
                </SelectTrigger>
                <SelectContent>
                  {subtypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError error={errors.subtype} />
        </FormRow>
      )}

      {type && (
        <FormRow label="Nome de exibição" description={isPharmacy ? 'Nome da farmácia na plataforma' : 'Nome do profissional como aparece para os pacientes'} required>
          <Controller name="name" control={control}
            render={({ field }) => (
              <Input {...field}
                placeholder={isPharmacy ? 'Farmácia Saúde' : 'Dr. João Silva'}
                className={cn(errors.name && 'border-destructive')} />
            )}
          />
          <FieldError error={errors.name} />
        </FormRow>
      )}

      {isSpecialist && conselho && (
        <>
          <FormRow label={`Número ${conselho}`}
            description={
              conselho === 'CRM' ? 'Número de registro no Conselho Regional de Medicina'
              : conselho === 'CRP' ? 'Número de registro no Conselho Regional de Psicologia'
              : 'Número de registro no Conselho Regional de Nutricionistas'
            } required>
            <Controller name="conselhoNumero" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="123456"
                  className={cn(errors.conselhoNumero && 'border-destructive')} />
              )}
            />
            <FieldError error={errors.conselhoNumero} />
          </FormRow>

          <FormRow label="UF do registro" description="Estado do conselho regional" required>
            <Controller name="conselhoUf" control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value as string}
                  onValueChange={field.onChange}
                  options={ESTADO_OPTIONS}
                  placeholder="Selecione a UF..."
                  searchPlaceholder="Buscar UF..."
                  error={!!errors.conselhoUf}
                />
              )}
            />
            <FieldError error={errors.conselhoUf} />
          </FormRow>

          {showRQE && (
            <FormRow label="RQE" description="Registro de Qualificação de Especialidade" required>
              <Controller name="rqe" control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="12345"
                    className={cn(errors.rqe && 'border-destructive')} />
                )}
              />
              <FieldError error={errors.rqe} />
            </FormRow>
          )}
        </>
      )}

      {isPharmacy && (
        <>
          <FormRow label="Responsável Técnico" description="Nome do farmacêutico responsável técnico" required>
            <Controller name="responsavelTecnicoNome" control={control}
              render={({ field }) => (
                <Input {...field}
                  className={cn(errors.responsavelTecnicoNome && 'border-destructive')} />
              )}
            />
            <FieldError error={errors.responsavelTecnicoNome} />
          </FormRow>

          <FormRow label="Número CRF" description="Número do Conselho Regional de Farmácia" required>
            <Controller name="responsavelTecnicoCrf" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="000000"
                  className={cn(errors.responsavelTecnicoCrf && 'border-destructive')} />
              )}
            />
            <FieldError error={errors.responsavelTecnicoCrf} />
          </FormRow>

          <FormRow label="UF do CRF" description="Estado do CRF do responsável técnico" required>
            <Controller name="responsavelTecnicoCrfUf" control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value as string}
                  onValueChange={field.onChange}
                  options={ESTADO_OPTIONS}
                  placeholder="Selecione a UF..."
                  searchPlaceholder="Buscar UF..."
                  error={!!errors.responsavelTecnicoCrfUf}
                />
              )}
            />
            <FieldError error={errors.responsavelTecnicoCrfUf} />
          </FormRow>

          <FormRow label="AFE" description={subtype === 'manipulacao' ? 'Autorização de Funcionamento (obrigatória)' : 'Autorização de Funcionamento da Empresa (Anvisa)'}>
            <Controller name="afeCodigo" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="000000"
                  className={cn(errors.afeCodigo && 'border-destructive')} />
              )}
            />
            <FieldError error={errors.afeCodigo} />
          </FormRow>

          <FormRow label="AE" description="Autorização Especial (Anvisa)">
            <Controller name="aeNumero" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="000000" />
              )}
            />
          </FormRow>

          <FormRow label="Alvará Sanitário" description="Número do alvará sanitário municipal">
            <Controller name="alvaraSanitario" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="00000/2025" />
              )}
            />
          </FormRow>
        </>
      )}
    </>
  )
}

function IdentificacaoReadonly({ form }: { form: UseFormReturn<FormData> }) {
  const vals = form.getValues()
  const typeLabel = TENANT_TYPES.find(t => t.value === vals.type)?.label || ''
  const allSubtypes = [...SPECIALIST_SUBTYPES, ...PHARMACY_SUBTYPES]
  const subtypeLabel = allSubtypes.find(s => s.value === vals.subtype)?.label || ''
  const conselho = vals.subtype ? getConselhoTipo(vals.subtype) : null
  const showRQE = vals.subtype ? requiresRQE(vals.subtype) : false

  return (
    <>
      <FormRow label="Tipo"><RoValue value={typeLabel} /></FormRow>
      <FormRow label="Subtipo"><RoValue value={subtypeLabel} /></FormRow>
      <FormRow label="Nome de exibição"><RoValue value={vals.name} /></FormRow>
      {vals.type === 'specialist' && conselho && (
        <>
          <FormRow label={`Número ${conselho}`}>
            <RoValue value={
              conselho === 'CRM' ? formatCRM(vals.conselhoUf, vals.conselhoNumero)
              : conselho === 'CRP' ? formatCRP(vals.conselhoUf, vals.conselhoNumero)
              : formatCRN(vals.conselhoUf, vals.conselhoNumero)
            } mono />
          </FormRow>
          <FormRow label="UF do registro"><RoValue value={vals.conselhoUf} /></FormRow>
          {showRQE && <FormRow label="RQE"><RoValue value={formatRQE(vals.rqe)} mono /></FormRow>}
        </>
      )}
      {vals.type === 'pharmacy' && (
        <>
          <FormRow label="Responsável Técnico"><RoValue value={vals.responsavelTecnicoNome} /></FormRow>
          <FormRow label="Número CRF"><RoValue value={formatCRF(vals.responsavelTecnicoCrfUf, vals.responsavelTecnicoCrf)} mono /></FormRow>
          <FormRow label="UF do CRF"><RoValue value={vals.responsavelTecnicoCrfUf} /></FormRow>
          {vals.afeCodigo && <FormRow label="AFE"><RoValue value={vals.afeCodigo} /></FormRow>}
          {vals.aeNumero && <FormRow label="AE"><RoValue value={vals.aeNumero} /></FormRow>}
          {vals.alvaraSanitario && <FormRow label="Alvará Sanitário"><RoValue value={vals.alvaraSanitario} /></FormRow>}
        </>
      )}
    </>
  )
}

// ─── Seção 2: Fiscal ──────────────────────────────────────────────────────────

function FiscalFields({ form }: { form: UseFormReturn<FormData> }) {
  const { control, watch, formState: { errors } } = form
  const type       = watch('type')
  const fiscalType = watch('fiscalType')
  const isPharmacy = type === 'pharmacy'
  const showPJ     = isPharmacy || fiscalType === 'pj'

  if (!type) {
    return (
      <div className="py-4 px-4 text-sm text-muted-foreground">
        Selecione o tipo de parceiro na seção Identificação para continuar.
      </div>
    )
  }

  return (
    <>
      <FormRow label="Tipo de pessoa" description="Pessoa física ou jurídica" required>
        {isPharmacy ? (
          <div className="h-8 rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground flex items-center">
            PJ: Pessoa Jurídica
          </div>
        ) : (
          <>
            <Controller name="fiscalType" control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(errors.fiscalType && 'border-destructive')}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">PF: Pessoa Física</SelectItem>
                    <SelectItem value="pj">PJ: Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError error={errors.fiscalType} />
          </>
        )}
      </FormRow>

      {fiscalType === 'pf' && !isPharmacy && (
        <FormRow label="CPF" description="Cadastro de Pessoa Física" required>
          <Controller name="cpf" control={control}
            render={({ field }) => (
              <Input {...field}
                onChange={(e) => field.onChange(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={cn(errors.cpf && 'border-destructive')}
              />
            )}
          />
          <FieldError error={errors.cpf} />
        </FormRow>
      )}

      {showPJ && !isPharmacy && (
        <FormRow label="CNPJ" description="Cadastro Nacional de Pessoa Jurídica" required>
          <Controller name="cnpj" control={control}
            render={({ field }) => (
              <Input {...field}
                onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                placeholder="00.000.000/0001-00"
                className={cn(errors.cnpj && 'border-destructive')}
              />
            )}
          />
          <FieldError error={errors.cnpj} />
        </FormRow>
      )}

      {isPharmacy && (
        <FormRow label="CNPJ" description="Cadastro Nacional de Pessoa Jurídica" required>
          <Controller name="cnpj" control={control}
            render={({ field }) => (
              <Input {...field}
                onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                placeholder="00.000.000/0001-00"
                className={cn(errors.cnpj && 'border-destructive')}
              />
            )}
          />
          <FieldError error={errors.cnpj} />
        </FormRow>
      )}

      {showPJ && (
        <>
          <FormRow label="Razão Social" description="Nome jurídico da empresa" required>
            <Controller name="razaoSocial" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Razão Social"
                  className={cn(errors.razaoSocial && 'border-destructive')} />
              )}
            />
            <FieldError error={errors.razaoSocial} />
          </FormRow>

          <FormRow label="Nome Fantasia" description="Nome comercial (opcional)">
            <Controller name="nomeFantasia" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Nome Fantasia" />
              )}
            />
          </FormRow>

          <FormRow label="Responsável Legal" description="Nome completo do responsável legal" required>
            <Controller name="responsavelLegalNome" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Nome do Responsável Legal"
                  className={cn(errors.responsavelLegalNome && 'border-destructive')} />
              )}
            />
            <FieldError error={errors.responsavelLegalNome} />
          </FormRow>
        </>
      )}

      <FormRow label="CPF do responsável" description="CPF do sócio ou responsável legal" required>
        <Controller name="responsavelLegalCpf" control={control}
          render={({ field }) => (
            <Input {...field}
              onChange={(e) => field.onChange(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              className={cn(errors.responsavelLegalCpf && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.responsavelLegalCpf} />
      </FormRow>

      <FormRow label="Regime tributário" description="Regime de apuração de impostos" required>
        <Controller name="regimeTributario" control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={cn(errors.regimeTributario && 'border-destructive')}>
                <SelectValue placeholder="Selecione o regime..." />
              </SelectTrigger>
              <SelectContent>
                {REGIME_TRIBUTARIO.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError error={errors.regimeTributario} />
      </FormRow>

      {isPharmacy && (
        <FormRow label="Inscrição Estadual" description="Inscrição estadual da farmácia" required>
          <Controller name="inscricaoEstadual" control={control}
            render={({ field }) => (
              <Input {...field}
                placeholder="Inscrição Estadual"
                className={cn(errors.inscricaoEstadual && 'border-destructive')} />
            )}
          />
          <FieldError error={errors.inscricaoEstadual} />
        </FormRow>
      )}
    </>
  )
}

function FiscalReadonly({ form }: { form: UseFormReturn<FormData> }) {
  const vals = form.getValues()
  const isPharmacy = vals.type === 'pharmacy'
  const fiscalLabel = isPharmacy ? 'PJ: Pessoa Jurídica'
    : vals.fiscalType === 'pf' ? 'PF: Pessoa Física'
    : vals.fiscalType === 'pj' ? 'PJ: Pessoa Jurídica' : ''
  const regimeLabel = REGIME_TRIBUTARIO.find(r => r.value === vals.regimeTributario)?.label || ''

  return (
    <>
      <FormRow label="Tipo de pessoa"><RoValue value={fiscalLabel} /></FormRow>
      {(isPharmacy || vals.fiscalType === 'pj') && (
        <FormRow label="CNPJ"><RoValue value={vals.cnpj} mono /></FormRow>
      )}
      {vals.fiscalType === 'pf' && !isPharmacy && (
        <FormRow label="CPF"><RoValue value={vals.cpf} mono /></FormRow>
      )}
      {(isPharmacy || vals.fiscalType === 'pj') && (
        <>
          <FormRow label="Razão Social"><RoValue value={vals.razaoSocial} /></FormRow>
          {vals.nomeFantasia && <FormRow label="Nome Fantasia"><RoValue value={vals.nomeFantasia} /></FormRow>}
          <FormRow label="Responsável Legal"><RoValue value={vals.responsavelLegalNome} /></FormRow>
        </>
      )}
      <FormRow label="CPF do responsável"><RoValue value={vals.responsavelLegalCpf} mono /></FormRow>
      <FormRow label="Regime tributário"><RoValue value={regimeLabel} /></FormRow>
      {isPharmacy && vals.inscricaoEstadual && (
        <FormRow label="Inscrição Estadual"><RoValue value={vals.inscricaoEstadual} /></FormRow>
      )}
    </>
  )
}

// ─── Seção 3: Contato ─────────────────────────────────────────────────────────

function ContatoFields({
  form, cepError, setCepError,
}: {
  form: UseFormReturn<FormData>
  cepError: boolean
  setCepError: (v: boolean) => void
}) {
  const { control, setValue, formState: { errors } } = form
  const [cidades, setCidades] = useState<string[]>([])

  async function fetchCidades(uf: string) {
    if (!uf) { setCidades([]); return }
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      const data: { nome: string }[] = await res.json()
      setCidades(data.map(c => c.nome))
    } catch {
      setCidades([])
    }
  }

  useEffect(() => {
    const uf = form.getValues('uf')
    if (uf) fetchCidades(uf)
  }, [])

  async function fetchViaCEP(raw: string, opts?: { showError?: boolean }) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 8) {
      if (opts?.showError) setCepError(true)
      return
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError(true)
        return
      }
      setCepError(false)
      setValue('logradouro', data.logradouro || '', { shouldValidate: true })
      setValue('bairro',     data.bairro     || '', { shouldValidate: true })
      setValue('cidade',     data.localidade || '', { shouldValidate: true })
      setValue('uf',         data.uf         || '', { shouldValidate: true })
      await fetchCidades(data.uf || '')
    } catch {
      setCepError(true)
    }
  }

  return (
    <>
      <FormRow label="E-mail" description="E-mail de contato do parceiro" required>
        <Controller name="email" control={control}
          render={({ field }) => (
            <Input {...field} type="email" placeholder="contato@clinica.com.br"
              className={cn(errors.email && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.email} />
      </FormRow>

      <FormRow label="Telefone" description="Telefone de contato" required>
        <Controller name="telefone" control={control}
          render={({ field }) => (
            <Input {...field}
              onChange={(e) => field.onChange(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className={cn(errors.telefone && 'border-destructive')}
            />
          )}
        />
        <FieldError error={errors.telefone} />
      </FormRow>

      <FormRow label="CEP" description="Preenchimento automático do endereço" required>
        <Controller name="cep" control={control}
          render={({ field }) => (
            <InputGroup className="shadow-none">
              <InputGroupInput
                {...field}
                onChange={(e) => {
                  field.onChange(maskCEP(e.target.value))
                  if (cepError) setCepError(false)
                }}
                onBlur={(e) => fetchViaCEP(e.target.value)}
                placeholder="00000-000"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="secondary"
                  onClick={() => fetchViaCEP(field.value, { showError: true })}
                >
                  Buscar
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
        />
        <FieldError error={errors.cep} />
      </FormRow>

      <FormRow label="UF" description="Estado" required>
        <Controller name="uf" control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val)
                setValue('cidade', '', { shouldValidate: false })
                fetchCidades(val)
              }}
              options={ESTADO_OPTIONS}
              placeholder="Selecione a UF..."
              searchPlaceholder="Buscar UF..."
              error={!!errors.uf}
            />
          )}
        />
        <FieldError error={errors.uf} />
      </FormRow>

      <FormRow label="Cidade" description="Município" required>
        <Controller name="cidade" control={control}
          render={({ field }) => (
            cidades.length > 0 ? (
              <SearchableSelect
                value={field.value}
                onValueChange={field.onChange}
                options={cidades.map((c) => ({ value: c, label: c }))}
                placeholder="Selecione a cidade..."
                searchPlaceholder="Buscar cidade..."
                error={!!errors.cidade}
              />
            ) : (
              <Input {...field} placeholder="Cidade" className={cn(errors.cidade && 'border-destructive')} />
            )
          )}
        />
        <FieldError error={errors.cidade} />
      </FormRow>

      <FormRow label="Logradouro" description="Rua, avenida, alameda..." required>
        <Controller name="logradouro" control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Logradouro"
              className={cn(errors.logradouro && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.logradouro} />
      </FormRow>

      <FormRow label="Número" description="Número do imóvel" required>
        <Controller name="numeroLogradouro" control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Número"
              className={cn(errors.numeroLogradouro && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.numeroLogradouro} />
      </FormRow>

      <FormRow label="Complemento" description="Sala, andar, bloco (opcional)">
        <Controller name="complemento" control={control}
          render={({ field }) => <Input {...field} placeholder="Complemento" />}
        />
      </FormRow>

      <FormRow label="Bairro" description="Bairro do endereço" required>
        <Controller name="bairro" control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Bairro"
              className={cn(errors.bairro && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.bairro} />
      </FormRow>
    </>
  )
}

function ContatoReadonly({ form }: { form: UseFormReturn<FormData> }) {
  const vals = form.getValues()
  return (
    <>
      <FormRow label="E-mail"><RoValue value={vals.email} /></FormRow>
      <FormRow label="Telefone"><RoValue value={vals.telefone} /></FormRow>
      <FormRow label="CEP"><RoValue value={vals.cep} mono /></FormRow>
      <FormRow label="UF"><RoValue value={vals.uf} /></FormRow>
      <FormRow label="Cidade"><RoValue value={vals.cidade} /></FormRow>
      <FormRow label="Logradouro"><RoValue value={vals.logradouro} /></FormRow>
      <FormRow label="Número"><RoValue value={vals.numeroLogradouro} /></FormRow>
      {vals.complemento && <FormRow label="Complemento"><RoValue value={vals.complemento} /></FormRow>}
      <FormRow label="Bairro"><RoValue value={vals.bairro} /></FormRow>
    </>
  )
}

// ─── Seção 4: Dados Bancários ─────────────────────────────────────────────────

function BancarioFields({ form }: { form: UseFormReturn<FormData> }) {
  const { control, watch, formState: { errors } } = form
  const pixTipo = watch('pixTipo')

  return (
    <>
      <FormRow label="Banco" description="Instituição bancária" required>
        <Controller name="banco" control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onValueChange={field.onChange}
              options={BANCOS}
              placeholder="Banco..."
              searchPlaceholder="Buscar banco..."
              error={!!errors.banco}
            />
          )}
        />
        <FieldError error={errors.banco} />
      </FormRow>

      <FormRow label="Tipo de conta" description="Corrente ou poupança" required>
        <Controller name="tipoConta" control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={cn(errors.tipoConta && 'border-destructive')}>
                <SelectValue placeholder="Tipo de conta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Conta Poupança</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError error={errors.tipoConta} />
      </FormRow>

      <FormRow label="Agência" description="Número da agência" required>
        <Controller name="agencia" control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Agência"
              className={cn(errors.agencia && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.agencia} />
      </FormRow>

      <FormRow label="Conta" description="Número da conta com dígito" required>
        <Controller name="conta" control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Conta"
              className={cn(errors.conta && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.conta} />
      </FormRow>

      <FormRow label="Nome do titular" description="Titular da conta bancária" required>
        <Controller name="titularNome" control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Nome do titular"
              className={cn(errors.titularNome && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.titularNome} />
      </FormRow>

      <FormRow label="CPF / CNPJ do titular" description="Documento do titular" required>
        <Controller name="titularDocumento" control={control}
          render={({ field }) => (
            <Input {...field}
              onChange={(e) => field.onChange(maskDoc(e.target.value))}
              placeholder="CPF / CNPJ"
              className={cn(errors.titularDocumento && 'border-destructive')}
            />
          )}
        />
        <FieldError error={errors.titularDocumento} />
      </FormRow>

      <FormRow label="Tipo de chave PIX" description="Tipo da chave PIX (opcional)">
        <Controller name="pixTipo" control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de chave..." />
              </SelectTrigger>
              <SelectContent>
                {PIX_TIPOS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormRow>

      {pixTipo && (
        <FormRow label="Chave PIX" description="Valor da chave PIX">
          <Controller name="pixValor" control={control}
            render={({ field }) => (
              <Input {...field}
                placeholder={
                  pixTipo === 'cpf'      ? '000.000.000-00'     :
                  pixTipo === 'cnpj'     ? '00.000.000/0001-00' :
                  pixTipo === 'email'    ? 'email@dominio.com'  :
                  pixTipo === 'telefone' ? '(11) 99999-9999'    :
                  'Chave aleatória (UUID)'
                }
              />
            )}
          />
          <FieldError error={errors.pixValor} />
        </FormRow>
      )}
    </>
  )
}

function BancarioReadonly({ form }: { form: UseFormReturn<FormData> }) {
  const vals = form.getValues()
  const bancoLabel = BANCOS.find(b => b.value === vals.banco)?.label || ''
  const tipoContaLabel = vals.tipoConta === 'corrente' ? 'Conta Corrente' : vals.tipoConta === 'poupanca' ? 'Conta Poupança' : ''
  const pixTipoLabel = PIX_TIPOS.find(p => p.value === vals.pixTipo)?.label || ''

  return (
    <>
      <FormRow label="Banco"><RoValue value={bancoLabel} /></FormRow>
      <FormRow label="Tipo de conta"><RoValue value={tipoContaLabel} /></FormRow>
      <FormRow label="Agência"><RoValue value={vals.agencia} mono /></FormRow>
      <FormRow label="Conta"><RoValue value={vals.conta} mono /></FormRow>
      <FormRow label="Nome do titular"><RoValue value={vals.titularNome} /></FormRow>
      <FormRow label="CPF / CNPJ do titular"><RoValue value={vals.titularDocumento} mono /></FormRow>
      {vals.pixTipo && (
        <>
          <FormRow label="Tipo de chave PIX"><RoValue value={pixTipoLabel} /></FormRow>
          <FormRow label="Chave PIX"><RoValue value={vals.pixValor} mono /></FormRow>
        </>
      )}
    </>
  )
}

// ─── Seção 5: Comercial ──────────────────────────────────────────────────────

function ComercialFields({ form }: { form: UseFormReturn<FormData> }) {
  const { control, formState: { errors } } = form

  return (
    <>
      <FormRow label="Taxa de comissão" description="Percentual retido pela Noun por consulta">
        <Controller name="commissionRate" control={control}
          render={({ field }) => (
            <Input {...field} type="number" step="0.01" min="0" max="100"
              placeholder="Taxa (%)"
              className={cn(errors.commissionRate && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.commissionRate} />
      </FormRow>

      <FormRow label="Prazo de repasse" description="Dias corridos após a consulta para o repasse">
        <Controller name="payoutDelayDays" control={control}
          render={({ field }) => (
            <Input {...field} type="number" min="0"
              placeholder="Prazo (dias)"
              className={cn(errors.payoutDelayDays && 'border-destructive')} />
          )}
        />
        <FieldError error={errors.payoutDelayDays} />
      </FormRow>
      <FormRow label="Observações" description="Condições especiais ou termos negociados">
        <Controller name="commercialNotes" control={control}
          render={({ field }) => (
            <Textarea {...field} placeholder="Condições especiais, termos negociados..."
              rows={3} />
          )}
        />
        <FieldError error={errors.commercialNotes} />
      </FormRow>
    </>
  )
}

function ComercialReadonly({ form }: { form: UseFormReturn<FormData> }) {
  const vals = form.getValues()
  return (
    <>
      <FormRow label="Taxa de comissão">
        <RoValue value={vals.commissionRate ? `${vals.commissionRate}%` : undefined} />
      </FormRow>
      <FormRow label="Prazo de repasse">
        <RoValue value={vals.payoutDelayDays ? `${vals.payoutDelayDays} dias` : undefined} />
      </FormRow>
      {vals.commercialNotes && (
        <FormRow label="Observações">
          <p className="text-sm">{vals.commercialNotes}</p>
        </FormRow>
      )}
    </>
  )
}

// ─── Seção 6: Termos ──────────────────────────────────────────────────────────

function TermosFields({
  form, adminName, disabled,
}: {
  form: UseFormReturn<FormData>
  adminName: string
  disabled?: boolean
}) {
  const { control, formState: { errors } } = form
  const today = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-start gap-3">
          <Controller name="termosAceitos" control={control}
            render={({ field }) => (
              <Checkbox
                id="termos"
                checked={field.value}
                onCheckedChange={disabled ? undefined : field.onChange}
                disabled={disabled}
              />
            )}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="termos" className={cn('font-medium leading-none', !disabled && 'cursor-pointer')}>
              Termos de Parceria Noun
            </Label>
            <p className="text-sm text-muted-foreground">
              O tenant declara estar ciente e de acordo com os Termos de Parceria da plataforma Noun,
              incluindo regras de operação, repasses e obrigações contratuais.
            </p>
          </div>
        </div>
        {!disabled && errors.termosAceitos?.message && (
          <p className="text-xs text-destructive pl-7">{errors.termosAceitos.message}</p>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-start gap-3">
          <Controller name="lgpdAceita" control={control}
            render={({ field }) => (
              <Checkbox
                id="lgpd"
                checked={field.value}
                onCheckedChange={disabled ? undefined : field.onChange}
                disabled={disabled}
              />
            )}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="lgpd" className={cn('font-medium leading-none', !disabled && 'cursor-pointer')}>
              Política de Privacidade e LGPD
            </Label>
            <p className="text-sm text-muted-foreground">
              O tenant confirma o tratamento de dados conforme a Lei Geral de Proteção de Dados (LGPD),
              autorizando a Noun a processar as informações necessárias para o funcionamento da plataforma.
            </p>
          </div>
        </div>
        {!disabled && errors.lgpdAceita?.message && (
          <p className="text-xs text-destructive pl-7">{errors.lgpdAceita.message}</p>
        )}
      </div>

      <div className="rounded-lg border border-dashed p-4 bg-muted pointer-events-none">
        <div className="grid grid-cols-2 gap-4">
          <RoValue label="Data e hora" value={today} mono />
          <RoValue label="Cadastrado por" value={adminName} />
        </div>
      </div>
    </div>
  )
}

function TermosReadonly({ form }: { form: UseFormReturn<FormData> }) {
  const vals = form.getValues()
  return (
    <div className="space-y-1">
      <RoValue label="Termos de Parceria Noun" value={vals.termosAceitos ? 'Sim' : 'Não'} />
      <RoValue label="Política de Privacidade e LGPD" value={vals.lgpdAceita ? 'Sim' : 'Não'} />
    </div>
  )
}

// ─── Tipo para edição ──────────────────────────────────────────────────────────

export interface TenantEditData {
  id: string
  status: string
  type: string
  subtype: string | null
  name: string
  cnpj: string | null
  razao_social: string | null
  nome_fantasia: string | null
  conselho_numero: string | null
  conselho_uf: string | null
  rqe: string | null
  responsavel_tecnico_nome: string | null
  responsavel_tecnico_crf: string | null
  responsavel_tecnico_crf_uf: string | null
  afe_codigo: string | null
  ae_numero: string | null
  alvara_sanitario: string | null
  fiscal_type: string | null
  cpf: string | null
  regime_tributario: string | null
  responsavel_legal_nome: string | null
  responsavel_legal_cpf: string | null
  inscricao_estadual: string | null
  email: string | null
  telefone: string | null
  cep: string | null
  logradouro: string | null
  numero_logradouro: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  titular_nome: string | null
  titular_documento: string | null
  pix_tipo: string | null
  pix_valor: string | null
  commission_rate: number | null
  payout_delay_days: number | null
  commercial_notes: string | null
  termos_aceitos_em: string | null
}

// ─── Campos de cada seção (para reset parcial) ───────────────────────────────

const IDENTIFICACAO_FIELDS: (keyof FormData)[] = [
  'type','subtype','name',
  'conselhoNumero','conselhoUf','rqe',
  'responsavelTecnicoNome','responsavelTecnicoCrf','responsavelTecnicoCrfUf',
  'afeCodigo','aeNumero','alvaraSanitario',
]
const FISCAL_FIELDS: (keyof FormData)[] = [
  'fiscalType','cpf','cnpj','razaoSocial','nomeFantasia',
  'regimeTributario','responsavelLegalNome','responsavelLegalCpf','inscricaoEstadual',
]
const CONTATO_FIELDS: (keyof FormData)[] = [
  'email','telefone','cep','logradouro','numeroLogradouro','complemento','bairro','cidade','uf',
]
const BANCARIO_FIELDS: (keyof FormData)[] = [
  'banco','agencia','conta','tipoConta','titularNome','titularDocumento','pixTipo','pixValor',
]
const COMERCIAL_FIELDS: (keyof FormData)[] = [
  'commissionRate','payoutDelayDays','commercialNotes',
]
const TERMOS_FIELDS: (keyof FormData)[] = ['termosAceitos','lgpdAceita']

const SECTION_FIELD_KEYS: Record<SectionKey, (keyof FormData)[]> = {
  identificacao: IDENTIFICACAO_FIELDS,
  fiscal: FISCAL_FIELDS,
  contato: CONTATO_FIELDS,
  bancario: BANCARIO_FIELDS,
  comercial: COMERCIAL_FIELDS,
  termos: TERMOS_FIELDS,
}

const SECTION_DB_KEYS: Record<SectionKey, string[]> = {
  identificacao: ['name', 'type', 'subtype', 'conselho_numero', 'conselho_uf', 'rqe', 'responsavel_tecnico_nome', 'responsavel_tecnico_crf', 'responsavel_tecnico_crf_uf', 'afe_codigo', 'ae_numero', 'alvara_sanitario'],
  fiscal: ['fiscal_type', 'cpf', 'cnpj', 'razao_social', 'nome_fantasia', 'regime_tributario', 'responsavel_legal_nome', 'responsavel_legal_cpf', 'inscricao_estadual'],
  contato: ['email', 'telefone', 'cep', 'logradouro', 'numero_logradouro', 'complemento', 'bairro', 'cidade', 'uf'],
  bancario: ['banco', 'agencia', 'conta', 'tipo_conta', 'titular_nome', 'titular_documento', 'pix_tipo', 'pix_valor'],
  comercial: ['commission_rate', 'payout_delay_days', 'commercial_notes'],
  termos: [],
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function NovoTenantForm({ adminName, initialData, noPadding = false }: { adminName: string; initialData?: TenantEditData; noPadding?: boolean }) {
  const router = useRouter()
  const isEdit = !!initialData

  const [loading, setLoading]         = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftId, setDraftId]         = useState<string | null>(initialData?.id ?? null)
  const [cepError, setCepError]       = useState(false)

  const [editingIdentificacao, setEditingIdentificacao] = useState(!isEdit)
  const [editingFiscal, setEditingFiscal]               = useState(!isEdit)
  const [editingContato, setEditingContato]             = useState(!isEdit)
  const [editingBancario, setEditingBancario]           = useState(!isEdit)
  const [editingComercial, setEditingComercial]         = useState(!isEdit)
  const [editingTermos, setEditingTermos]               = useState(!isEdit)

  const editingState: { [K in SectionKey]: boolean } = {
    identificacao: editingIdentificacao,
    fiscal: editingFiscal,
    contato: editingContato,
    bancario: editingBancario,
    comercial: editingComercial,
    termos: editingTermos,
  }
  const editingSetters: { [K in SectionKey]: (v: boolean) => void } = {
    identificacao: setEditingIdentificacao,
    fiscal: setEditingFiscal,
    contato: setEditingContato,
    bancario: setEditingBancario,
    comercial: setEditingComercial,
    termos: setEditingTermos,
  }

  const refIdentificacao = useRef<HTMLDivElement>(null)
  const refFiscal        = useRef<HTMLDivElement>(null)
  const refContato       = useRef<HTMLDivElement>(null)
  const refBancario      = useRef<HTMLDivElement>(null)
  const refComercial     = useRef<HTMLDivElement>(null)
  const refTermos        = useRef<HTMLDivElement>(null)
  const sectionRefs: { [K in SectionKey]: React.RefObject<HTMLDivElement | null> } = {
    identificacao: refIdentificacao,
    fiscal:        refFiscal,
    contato:       refContato,
    bancario:      refBancario,
    comercial:     refComercial,
    termos:        refTermos,
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      type:     initialData.type || '',
      subtype:  initialData.subtype || '',
      name:     initialData.name || '',

      conselhoNumero:  initialData.conselho_numero || '',
      conselhoUf:      initialData.conselho_uf || '',
      rqe:             initialData.rqe || '',

      responsavelTecnicoNome:  initialData.responsavel_tecnico_nome || '',
      responsavelTecnicoCrf:   initialData.responsavel_tecnico_crf || '',
      responsavelTecnicoCrfUf: initialData.responsavel_tecnico_crf_uf || '',
      afeCodigo:       initialData.afe_codigo || '',
      aeNumero:        initialData.ae_numero || '',
      alvaraSanitario: initialData.alvara_sanitario || '',

      fiscalType:           initialData.type === 'pharmacy' ? 'pj' : (initialData.fiscal_type || ''),
      cpf:                  initialData.cpf ? maskCPF(initialData.cpf) : '',
      cnpj:                 initialData.cnpj ? maskCNPJ(initialData.cnpj) : '',
      razaoSocial:          initialData.razao_social || '',
      nomeFantasia:         initialData.nome_fantasia || '',
      regimeTributario:     initialData.regime_tributario || '',
      responsavelLegalNome: initialData.responsavel_legal_nome || '',
      responsavelLegalCpf:  initialData.responsavel_legal_cpf ? maskCPF(initialData.responsavel_legal_cpf) : '',
      inscricaoEstadual:    initialData.inscricao_estadual || '',

      email:            initialData.email || '',
      telefone:         initialData.telefone ? maskPhone(initialData.telefone) : '',
      cep:              initialData.cep ? maskCEP(initialData.cep) : '',
      logradouro:       initialData.logradouro || '',
      numeroLogradouro: initialData.numero_logradouro || '',
      complemento:      initialData.complemento || '',
      bairro:           initialData.bairro || '',
      cidade:           initialData.cidade || '',
      uf:               initialData.uf || '',

      banco:            initialData.banco || '',
      agencia:          initialData.agencia || '',
      conta:            initialData.conta || '',
      tipoConta:        initialData.tipo_conta || '',
      titularNome:      initialData.titular_nome || '',
      titularDocumento: initialData.titular_documento ? maskDoc(initialData.titular_documento) : '',
      pixTipo:          initialData.pix_tipo || '',
      pixValor:         initialData.pix_valor || '',

      commissionRate:   initialData.commission_rate != null ? String(initialData.commission_rate) : '',
      payoutDelayDays:  initialData.payout_delay_days != null ? String(initialData.payout_delay_days) : '',
      commercialNotes:  initialData.commercial_notes || '',

      termosAceitos:    !!initialData.termos_aceitos_em,
      lgpdAceita:       !!initialData.termos_aceitos_em,
    } : {
      type: '', subtype: '', name: '',
      conselhoNumero: '', conselhoUf: '', rqe: '',
      responsavelTecnicoNome: '', responsavelTecnicoCrf: '', responsavelTecnicoCrfUf: '',
      afeCodigo: '', aeNumero: '', alvaraSanitario: '',
      fiscalType: '', cpf: '', cnpj: '', razaoSocial: '', nomeFantasia: '',
      regimeTributario: '', responsavelLegalNome: '', responsavelLegalCpf: '', inscricaoEstadual: '',
      email: '', telefone: '', cep: '', logradouro: '', numeroLogradouro: '',
      complemento: '', bairro: '', cidade: '', uf: '',
      banco: '', agencia: '', conta: '', tipoConta: '',
      titularNome: '', titularDocumento: '', pixTipo: '', pixValor: '',
      commissionRate: '', payoutDelayDays: '', commercialNotes: '',
      termosAceitos: false, lgpdAceita: false,
    },
  })

  function resetSection(section: SectionKey) {
    const fields = SECTION_FIELD_KEYS[section]
    for (const f of fields) {
      form.resetField(f)
    }
    editingSetters[section](false)
  }

  async function saveSectionToDb(section: SectionKey) {
    if (!draftId) return
    const dbKeys = SECTION_DB_KEYS[section]
    if (!dbKeys.length) {
      editingSetters[section](false)
      return
    }

    setLoading(true)
    try {
      const data = form.getValues()
      const fullPayload = buildPayload(data) as Record<string, unknown>
      const partial: Record<string, unknown> = {}
      for (const key of dbKeys) {
        if (key in fullPayload) partial[key] = fullPayload[key]
      }

      const result = await atualizarTenant(draftId, partial)
      if (result.error) throw new Error(result.error)

      toast.success('Alterações salvas')
      editingSetters[section](false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  function buildPayload(data: FormData) {
    const isPharmacy = data.type === 'pharmacy'
    const cnpjDigits = data.cnpj.replace(/\D/g, '') || null

    return {
      name:     data.name,
      type:     isPharmacy ? 'pharmacy' as const : 'specialist' as const,
      subtype:  data.subtype || null,

      cnpj: (isPharmacy || data.fiscalType === 'pj') ? cnpjDigits : null,
      razao_social:  data.razaoSocial || null,
      nome_fantasia: data.nomeFantasia || null,

      conselho_numero: !isPharmacy ? (data.conselhoNumero || null) : null,
      conselho_uf:     !isPharmacy ? (data.conselhoUf || null) : null,
      rqe:             !isPharmacy ? (data.rqe || null) : null,

      responsavel_tecnico_nome:   isPharmacy ? (data.responsavelTecnicoNome || null) : null,
      responsavel_tecnico_crf:    isPharmacy ? (data.responsavelTecnicoCrf || null) : null,
      responsavel_tecnico_crf_uf: isPharmacy ? (data.responsavelTecnicoCrfUf || null) : null,
      afe_codigo:       isPharmacy ? (data.afeCodigo || null) : null,
      ae_numero:        isPharmacy ? (data.aeNumero || null) : null,
      alvara_sanitario: isPharmacy ? (data.alvaraSanitario || null) : null,

      fiscal_type:           isPharmacy ? 'pj' : (data.fiscalType || null),
      cpf:                   data.cpf.replace(/\D/g, '') || null,
      regime_tributario:     data.regimeTributario || null,
      responsavel_legal_nome: data.responsavelLegalNome || null,
      responsavel_legal_cpf:  data.responsavelLegalCpf.replace(/\D/g, '') || null,
      inscricao_estadual:    isPharmacy ? (data.inscricaoEstadual || null) : null,

      email:             data.email,
      telefone:          data.telefone.replace(/\D/g, '') || null,
      cep:               data.cep.replace(/\D/g, '') || null,
      logradouro:        data.logradouro,
      numero_logradouro: data.numeroLogradouro,
      complemento:       data.complemento || null,
      bairro:            data.bairro,
      cidade:            data.cidade,
      uf:                data.uf,

      banco:             data.banco,
      agencia:           data.agencia,
      conta:             data.conta,
      tipo_conta:        data.tipoConta,
      titular_nome:      data.titularNome,
      titular_documento: data.titularDocumento.replace(/\D/g, '') || null,
      pix_tipo:          data.pixTipo || null,
      pix_valor:         data.pixValor || null,

      commission_rate:    data.commissionRate ? parseFloat(data.commissionRate) : null,
      payout_delay_days:  data.payoutDelayDays ? parseInt(data.payoutDelayDays, 10) : null,
      commercial_notes:   data.commercialNotes || null,
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const payload = buildPayload(data)

      if (isEdit && draftId) {
        const result = await atualizarTenant(draftId, payload)
        if (result.error) throw new Error(result.error)

        toast.success('Tenant atualizado com sucesso!')

        if (!noPadding) {
          router.push('/tenants')
          router.refresh()
        }
      } else {
        const supabase = createSupabaseBrowser()
        const { error } = await supabase
          .from('tenants')
          .insert({
            ...payload,
            status: 'active',
            settings: {},
            termos_aceitos_em: new Date().toISOString(),
            termos_cadastrado_por: adminName,
          })

        if (error) throw error

        toast.success('Tenant cadastrado com sucesso!')
        router.push('/tenants')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast.error(isEdit ? 'Erro ao atualizar. Verifique os dados e tente novamente.' : 'Erro ao cadastrar. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function onInvalid(errors: FieldErrors<FormData>) {
    const keys = Object.keys(errors)
    const sectionKeys: SectionKey[] = ['identificacao', 'fiscal', 'contato', 'bancario', 'comercial', 'termos']
    for (const s of sectionKeys) {
      if (SECTION_FIELDS[s].some((f) => keys.includes(f))) {
        editingSetters[s](true)
        sectionRefs[s].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
    toast.error('Corrija os erros destacados e tente novamente')
  }

  async function saveDraft() {
    setSavingDraft(true)
    try {
      const data = form.getValues()
      const isPharmacy = data.type === 'pharmacy'
      const cnpjDigits = data.cnpj.replace(/\D/g, '') || null

      const draftPayload = {
        name:     data.name || 'Rascunho',
        type:     isPharmacy ? 'pharmacy' as const : data.type === 'specialist' ? 'specialist' as const : 'specialist' as const,
        subtype:  data.subtype || null,
        status:   'draft',
        settings: {},

        cnpj: (isPharmacy || data.fiscalType === 'pj') ? cnpjDigits : null,
        razao_social:  data.razaoSocial || null,
        nome_fantasia: data.nomeFantasia || null,

        conselho_numero: data.conselhoNumero || null,
        conselho_uf:     data.conselhoUf || null,
        rqe:             data.rqe || null,

        responsavel_tecnico_nome:   data.responsavelTecnicoNome || null,
        responsavel_tecnico_crf:    data.responsavelTecnicoCrf || null,
        responsavel_tecnico_crf_uf: data.responsavelTecnicoCrfUf || null,
        afe_codigo:       data.afeCodigo || null,
        ae_numero:        data.aeNumero || null,
        alvara_sanitario: data.alvaraSanitario || null,

        fiscal_type:           isPharmacy ? 'pj' : (data.fiscalType || null),
        cpf:                   data.cpf.replace(/\D/g, '') || null,
        regime_tributario:     data.regimeTributario || null,
        responsavel_legal_nome: data.responsavelLegalNome || null,
        responsavel_legal_cpf:  data.responsavelLegalCpf.replace(/\D/g, '') || null,
        inscricao_estadual:    data.inscricaoEstadual || null,

        email:             data.email || null,
        telefone:          data.telefone.replace(/\D/g, '') || null,
        cep:               data.cep.replace(/\D/g, '') || null,
        logradouro:        data.logradouro || null,
        numero_logradouro: data.numeroLogradouro || null,
        complemento:       data.complemento || null,
        bairro:            data.bairro || null,
        cidade:            data.cidade || null,
        uf:                data.uf || null,

        banco:             data.banco || null,
        agencia:           data.agencia || null,
        conta:             data.conta || null,
        tipo_conta:        data.tipoConta || null,
        titular_nome:      data.titularNome || null,
        titular_documento: data.titularDocumento.replace(/\D/g, '') || null,
        pix_tipo:          data.pixTipo || null,
        pix_valor:         data.pixValor || null,

        commission_rate:   data.commissionRate ? parseFloat(data.commissionRate) : null,
        payout_delay_days: data.payoutDelayDays ? parseInt(data.payoutDelayDays, 10) : null,
        commercial_notes:  data.commercialNotes || null,
      }

      const supabase = createSupabaseBrowser()

      if (draftId) {
        const { error } = await supabase.from('tenants').update(draftPayload).eq('id', draftId)
        if (error) throw error
      } else {
        const { data: inserted, error } = await supabase
          .from('tenants')
          .insert(draftPayload)
          .select('id')
          .single()
        if (error) throw error
        setDraftId(inserted!.id)
      }

      toast.success('Rascunho salvo')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar rascunho')
    } finally {
      setSavingDraft(false)
    }
  }

  const SECTIONS: { key: SectionKey; title: string; description: string }[] = [
    { key: 'identificacao', title: 'Identificação',    description: 'Tipo de parceiro e dados profissionais ou empresariais' },
    { key: 'fiscal',        title: 'Fiscal',           description: 'Informações de faturamento e documentação fiscal' },
    { key: 'contato',       title: 'Contato',          description: 'E-mail, telefone e endereço completo' },
    { key: 'bancario',      title: 'Dados Bancários',  description: 'Conta bancária para recebimento de repasses' },
    { key: 'comercial',     title: 'Comercial',        description: 'Taxas de comissão e condições de repasse' },
    { key: 'termos',        title: 'Termos',           description: 'Aceites obrigatórios para ativação do parceiro' },
  ]

  function renderEditFields(key: SectionKey) {
    switch (key) {
      case 'identificacao': return <IdentificacaoFields form={form} />
      case 'fiscal':        return <FiscalFields form={form} />
      case 'contato':       return <ContatoFields form={form} cepError={cepError} setCepError={setCepError} />
      case 'bancario':      return <BancarioFields form={form} />
      case 'comercial':     return <ComercialFields form={form} />
      case 'termos':        return <TermosFields form={form} adminName={adminName} />
    }
  }

  function renderReadonlyFields(key: SectionKey) {
    switch (key) {
      case 'identificacao': return <IdentificacaoReadonly form={form} />
      case 'fiscal':        return <FiscalReadonly form={form} />
      case 'contato':       return <ContatoReadonly form={form} />
      case 'bancario':      return <BancarioReadonly form={form} />
      case 'comercial':     return <ComercialReadonly form={form} />
      case 'termos':        return <TermosFields form={form} adminName={adminName} disabled />
    }
  }

  return (
    <>
      {cepError && (
        <Alert variant="destructive" shape="banner" className="sticky top-12 z-[9]">
          <IconAlertCircle size={16} />
          <AlertTitle>CEP não encontrado</AlertTitle>
          <AlertDescription>Verifique o número digitado ou preencha o endereço manualmente.</AlertDescription>
          <AlertActions>
            <AlertClose onClick={() => setCepError(false)} />
          </AlertActions>
        </Alert>
      )}
      <div className={cn(noPadding ? 'space-y-4' : 'p-6 space-y-4')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{isEdit ? 'Editar Tenant' : 'Novo Tenant'}</h1>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? 'Edite os dados do parceiro na plataforma Noun'
                : 'Preencha os dados para cadastrar um novo parceiro na plataforma Noun'}
            </p>
          </div>
          {isEdit && !noPadding && (
            <div className="flex items-center gap-2 shrink-0">
              <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/tenants')} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" form="tenant-edit-form" size="sm" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <form id="tenant-edit-form" onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-0 pt-4">
          {SECTIONS.map((section, idx) => {
            const editing = editingState[section.key]
            const isTermos = section.key === 'termos'
            return (
              <React.Fragment key={section.key}>
                {idx > 0 && <Separator className="my-8" />}
                <div ref={sectionRefs[section.key]} className="scroll-mt-6 grid grid-cols-[220px_580px] gap-8 mx-auto">
                  {isTermos ? <div /> : <SectionHeader title={section.title} description={section.description} />}
                  {isTermos ? (
                    <div>
                      {editing ? renderEditFields(section.key) : renderReadonlyFields(section.key)}
                      {isEdit && (
                        <div className="flex items-center justify-end gap-2 pt-3">
                          {editing ? (
                            <>
                              <Button type="button" variant="ghost" size="sm"
                                onClick={() => resetSection(section.key)}>
                                Cancelar
                              </Button>
                              <Button type="button" size="sm" disabled={loading}
                                onClick={() => saveSectionToDb(section.key)}>
                                {loading ? 'Salvando...' : 'Salvar alterações'}
                              </Button>
                            </>
                          ) : (
                            <Button type="button" variant="ghost" size="sm"
                              onClick={() => editingSetters[section.key](true)}>
                              Editar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border divide-y [&>*:last-child]:border-t-0">
                      {editing ? renderEditFields(section.key) : renderReadonlyFields(section.key)}
                      {isEdit && (
                        <div className="flex items-center justify-end gap-2 px-4 py-3">
                          {editing ? (
                            <>
                              <Button type="button" variant="ghost" size="sm"
                                onClick={() => resetSection(section.key)}>
                                Cancelar
                              </Button>
                              <Button type="button" size="sm" disabled={loading}
                                onClick={() => saveSectionToDb(section.key)}>
                                {loading ? 'Salvando...' : 'Salvar alterações'}
                              </Button>
                            </>
                          ) : (
                            <Button type="button" variant="ghost" size="sm"
                              onClick={() => editingSetters[section.key](true)}>
                              Editar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            )
          })}

          {!(isEdit && noPadding) && (
            <>
              <Separator className="my-8" />

              <div className="flex items-center justify-between">
                {!isEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/tenants')}
                    disabled={loading || savingDraft}
                  >
                    Cancelar
                  </Button>
                )}
                <div className={isEdit ? 'flex items-center gap-2 ml-auto' : 'flex items-center gap-2'}>
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={saveDraft}
                      disabled={loading || savingDraft}
                    >
                      {savingDraft ? 'Salvando...' : 'Salvar rascunho'}
                    </Button>
                  )}
                  {isEdit && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/tenants')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" disabled={loading || savingDraft}>
                    {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar Tenant'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  )
}
