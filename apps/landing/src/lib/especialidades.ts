import {
  IconGenderFemale,
  IconActivityHeartbeat,
  IconSalad,
  IconBrain,
  IconDroplet,
  type Icon,
} from '@tabler/icons-react'

export type EspecialidadeSlug =
  | 'ginecologia'
  | 'endocrinologia'
  | 'nutricao'
  | 'psicologia'
  | 'urologia'

export type Especialidade = {
  slug: EspecialidadeSlug
  icon: Icon
  title: string
  body: string
}

export const ESPECIALIDADES: Especialidade[] = [
  {
    slug: 'ginecologia',
    icon: IconGenderFemale,
    title: 'Ginecologia',
    body: 'Para acompanhamento hormonal, ciclo e saúde reprodutiva.',
  },
  {
    slug: 'endocrinologia',
    icon: IconActivityHeartbeat,
    title: 'Endocrinologia',
    body: 'Para investigar e acompanhar alterações hormonais.',
  },
  {
    slug: 'nutricao',
    icon: IconSalad,
    title: 'Nutrição',
    body: 'Para ajustar a alimentação ao seu momento hormonal.',
  },
  {
    slug: 'psicologia',
    icon: IconBrain,
    title: 'Psicologia',
    body: 'Para cuidar da saúde emocional em cada etapa da jornada.',
  },
  {
    slug: 'urologia',
    icon: IconDroplet,
    title: 'Urologia',
    body: 'Para saúde urológica e hormonal masculina.',
  },
]
