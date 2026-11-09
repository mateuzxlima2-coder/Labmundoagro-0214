export type Category = "solo" | "agua" | "nematoides";

export interface Analysis {
  id: string;
  category: Category;
  name: string;
  description: string;
  parameters: string[];
  price: number; // centavos
  turnaroundDays: number;
  sampleInfo: string;
  popular?: boolean;
}

export const CATALOG: Analysis[] = [
  {
    id: "solo-basica",
    category: "solo",
    name: "Química básica",
    description: "Fertilidade essencial para recomendação de calagem e adubação.",
    parameters: ["pH (CaCl₂)", "M.O.", "P (resina/Mehlich)", "K, Ca, Mg", "Al, H+Al", "SB, CTC, V%"],
    price: 6000,
    turnaroundDays: 5,
    sampleInfo: "300–500 g de solo seco, 0–20 cm, composta de 15–20 subamostras.",
    popular: true,
  },
  {
    id: "solo-completa",
    category: "solo",
    name: "Química completa + micronutrientes",
    description: "Básica somada a enxofre e micronutrientes para manejo de alta produtividade.",
    parameters: ["Tudo da básica", "S", "B, Cu, Fe, Mn, Zn"],
    price: 9500,
    turnaroundDays: 7,
    sampleInfo: "500 g de solo seco ao ar, saco plástico limpo e identificado.",
  },
  {
    id: "solo-fisica",
    category: "solo",
    name: "Física / granulometria",
    description: "Textura do solo (argila, silte e areia) para classificação e zoneamento.",
    parameters: ["Argila", "Silte", "Areia total", "Classe textural"],
    price: 5500,
    turnaroundDays: 7,
    sampleInfo: "500 g de solo, sem torrões grandes ou raízes.",
  },
  {
    id: "agua-irrigacao",
    category: "agua",
    name: "Água para irrigação",
    description: "Qualidade para irrigação e fertirrigação: salinidade, sodicidade e dureza.",
    parameters: ["pH", "Condutividade elétrica", "RAS", "Ca, Mg, Na, K", "Cloretos", "Bicarbonatos"],
    price: 12000,
    turnaroundDays: 6,
    sampleInfo: "1 L em frasco limpo, enxaguado com a própria água. Entregar em até 24 h.",
    popular: true,
  },
  {
    id: "agua-potabilidade",
    category: "agua",
    name: "Potabilidade físico-química",
    description: "Parâmetros físico-químicos para consumo humano e animal.",
    parameters: ["pH", "Turbidez", "Cor", "Dureza", "Ferro", "Nitrato", "Cloro residual"],
    price: 15000,
    turnaroundDays: 7,
    sampleInfo: "1 L em frasco limpo, mantido refrigerado até a entrega.",
  },
  {
    id: "agua-micro",
    category: "agua",
    name: "Microbiológica",
    description: "Coliformes totais e E. coli em água de poço, nascente ou reservatório.",
    parameters: ["Coliformes totais", "Escherichia coli", "Bactérias heterotróficas"],
    price: 9000,
    turnaroundDays: 3,
    sampleInfo: "Frasco estéril (fornecido pelo laboratório). Refrigerado, entrega em até 24 h.",
  },
  {
    id: "nema-solo",
    category: "nematoides",
    name: "Nematoides em solo",
    description: "Extração e contagem dos principais gêneros fitoparasitas no solo.",
    parameters: ["Pratylenchus", "Heterodera", "Meloidogyne", "Rotylenchulus", "Helicotylenchus"],
    price: 8500,
    turnaroundDays: 5,
    sampleInfo: "500 g de solo úmido da rizosfera, 0–20 cm. Não secar nem expor ao sol.",
    popular: true,
  },
  {
    id: "nema-raiz",
    category: "nematoides",
    name: "Nematoides em raízes",
    description: "Extração em tecido radicular para quantificação por grama de raiz.",
    parameters: ["Contagem por 10 g de raiz", "Gêneros presentes"],
    price: 9000,
    turnaroundDays: 5,
    sampleInfo: "20–50 g de raízes finas com solo aderido, em saco plástico fechado.",
  },
  {
    id: "nema-especie",
    category: "nematoides",
    name: "Identificação de espécie",
    description: "Identificação morfológica de espécies para escolha de cultivar e manejo.",
    parameters: ["Meloidogyne spp.", "Pratylenchus spp.", "Laudo com recomendação"],
    price: 18000,
    turnaroundDays: 12,
    sampleInfo: "Solo + raízes da mesma reboleira, refrigerados.",
  },
];

export const PICKUP_FEE = 8000; // coleta na propriedade
export const LAB_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
export const PICKUP_SLOTS = ["Manhã (8h–12h)", "Tarde (13h–17h)"];
export const LAB_SLOT_CAPACITY = 4;
export const PICKUP_SLOT_CAPACITY = 2;

export const LAB_ADDRESS = {
  name: "Laboratório Mundo Agro",
  street: "Av. Setembrino Pelissari, 275",
  city: "Pinheiros — ES",
  zip: "29980-000",
};

export const LAB_CONTACT = {
  phone: "+55 (27) 99848-8848",
  whatsapp: "5527998488848",
  email: "mundoagrolaboratorio@gmail.com",
};

export const TERMS_VERSION = "2026-10";
