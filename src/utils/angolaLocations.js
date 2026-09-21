/**
 * Dados geográficos de Angola (províncias e municípios).
 *
 * Referência: Lei 14/24 (nova divisão político-administrativa, em vigor
 * desde setembro de 2024) — 21 províncias e 326 municípios.
 *
 * Utilizados no formulário de fornecedores para que os municípios
 * sejam sempre carregados consoante a província seleccionada,
 * sem depender de APIs externas instáveis.
 */

export const PROVINCES = [
  {
    nome: "Bengo",
    municipios: [
      "Ambriz", "Barra do Dande", "Bula Atumba", "Dande", "Muxaluando",
      "Nambuangongo", "Pango Aluquém", "Panguila", "Piri", "Quibaxe",
      "Quicunzo", "Úcua",
    ],
  },
  {
    nome: "Benguela",
    municipios: [
      "Babaera", "Baía Farta", "Balombo", "Benguela", "Biópio", "Bocoio",
      "Bolonguera", "Caimbambo", "Canhamela", "Capupa", "Catengue",
      "Catumbela", "Chicuma", "Chila", "Chindumbo", "Chongorói", "Cubal",
      "Dombe Grande", "Egito Praia", "Ganda", "Iambala", "Lobito", "Navegantes",
    ],
  },
  {
    nome: "Bié",
    municipios: [
      "Andulo", "Belo Horizonte", "Calucinga", "Camacupa", "Cambandua",
      "Catabola", "Chicala", "Chinguar", "Chipeta", "Chitembo", "Cuemba",
      "Cuito", "Cunhinga", "Luando", "Lúbia", "Mumbué", "Nharea", "Ringoma",
      "Umpulo",
    ],
  },
  {
    nome: "Cabinda",
    municipios: [
      "Belize", "Buco Zau", "Cabinda", "Cacongo", "Liambo", "Massabi",
      "Miconje", "Necuto", "Ngoio", "Tando Zinze",
    ],
  },
  {
    nome: "Cuando",
    municipios: [
      "Cuito Cuanavale", "Dima", "Dirico", "Luengue", "Luiana", "Mavinga",
      "Mucusso", "Rivungo", "Xipundo",
    ],
  },
  {
    nome: "Cuanza Norte",
    municipios: [
      "Aldeia Nova", "Ambaca", "Banga", "Bolongongo", "Caculo Cabaça",
      "Cambambe", "Cazengo", "Cerca", "Golungo Alto", "Lucala", "Luinga",
      "Massangano", "Ngonguembo", "Quiculungo", "Samba Cajú", "Tango",
      "Terreiro",
    ],
  },
  {
    nome: "Cuanza Sul",
    municipios: [
      "Amboiva", "Boa Entrada", "Calulo", "Cassongue", "Conda", "Condé",
      "Ebo", "Gabela", "Ngangula", "Gungo", "Lonhe", "Munenga", "Mussende",
      "Pambangala", "Porto Amboim", "Quenha", "Quibala", "Quilenda",
      "Quirimbo", "Quissongo", "Sanga", "Seles", "Sumbe", "Waku Kungo",
    ],
  },
  {
    nome: "Cubango",
    municipios: [
      "Caiundo", "Calai", "Chinguanja", "Cuangar", "Cuchi", "Cutato", "Longa",
      "Mavengue", "Menongue", "Nancova", "Savate",
    ],
  },
  {
    nome: "Cunene",
    municipios: [
      "Cafima", "Cahama", "Chiede", "Chissuata", "Chitado", "Cuanhama",
      "Curoca", "Cuvelai", "Humbe", "Mupa", "Namacunde", "Naulila", "Nehone",
      "Ombadja",
    ],
  },
  {
    nome: "Huambo",
    municipios: [
      "Alto Hama", "Bailundo", "Bimbe", "Caála", "Cachiungo",
      "Chicala Choloanga", "Chilata", "Chinjenje", "Cuíma", "Ecunha",
      "Galanga", "Huambo", "Londuimbali", "Longonjo", "Mungo", "Sambo",
      "Ucuma",
    ],
  },
  {
    nome: "Huíla",
    municipios: [
      "Caconda", "Cacula", "Caluquembe", "Capelongo", "Capunda Cavilongo",
      "Chibia", "Chicomba", "Chicungo", "Chipindo", "Chituto", "Cuvango",
      "Dongo", "Galangue", "Gambos", "Hoque", "Humpata", "Jamba Mineira",
      "Lubango", "Matala", "Palanca", "Quilengues", "Quipungo", "Viti Vivali",
    ],
  },
  {
    nome: "Icolo e Bengo",
    municipios: [
      "Bom Jesus", "Cabiri", "Cabo Ledo", "Calumbo", "Catete", "Quicama",
      "Sequele",
    ],
  },
  {
    nome: "Luanda",
    municipios: [
      "Belas", "Cacuaco", "Camama", "Cazenga", "Hoji ya Henda", "Ingombota",
      "Kilamba", "Kilamba Kiaxi", "Maianga", "Mulenvos", "Mussulo", "Rangel",
      "Samba", "Sambizanga", "Talatona", "Viana",
    ],
  },
  {
    nome: "Lunda Norte",
    municipios: [
      "Cafunfo", "Camaxilo", "Cambulo", "Canzar", "Capenda Camulemba",
      "Cassanje Calucala", "Caungula", "Chitato", "Cuango", "Cuilo", "Dundo",
      "Lóvua", "Luangue", "Lubalo", "Lucapa", "Luremo", "Mussungue",
      "Xa Cassau", "Xá Muteba",
    ],
  },
  {
    nome: "Lunda Sul",
    municipios: [
      "Alto Chicapa", "Cacolo", "Cassai Sul", "Cassengo", "Cazage",
      "Chiluage", "Dala", "Luma Cassai", "Muangueji", "Muconda", "Muriege",
      "Saurimo", "Sombo", "Xassengue",
    ],
  },
  {
    nome: "Malanje",
    municipios: [
      "Caculama", "Cacuso", "Cahombo", "Calandula", "Cambo Suinginge",
      "Cambundi Catembo", "Cangandala", "Capunda", "Cateco Cangola", "Cuale",
      "Kiwaba Nzoji", "Kunda dya Baze", "Luquembo", "Malanje", "Marimba",
      "Massango", "Mbanji ya Ngola", "Milando", "Muquixe", "Ngola Luiji",
      "Pungu a Ndongo", "Quela", "Quessua", "Quihuhu", "Quirima", "Quitapa",
      "Xandel",
    ],
  },
  {
    nome: "Moxico",
    municipios: [
      "Alto Cuito", "Camanongue", "Cangamba", "Cangumbe", "Chiume", "Léua",
      "Lucusse", "Luena", "Lumbala Nguimbo", "Lutembo", "Lutuai", "Ninda",
    ],
  },
  {
    nome: "Moxico Leste",
    municipios: [
      "Caianda", "Cameia", "Cazombo", "Lago Dilolo", "Lóvua do Zambeze",
      "Luacano", "Luau", "Macondo", "Nana Candundo",
    ],
  },
  {
    nome: "Namibe",
    municipios: [
      "Bibala", "Cacimbas", "Camucuio", "Iona", "Lucira", "Moçâmedes",
      "Sacomar", "Tômbwa", "Virei",
    ],
  },
  {
    nome: "Uíge",
    municipios: [
      "Alto Zaza", "Ambuíla", "Bembe", "Bungo", "Cangola", "Damba",
      "Dange Quitexe", "Lucunga", "Maquela do Zombo", "Massau", "Milunga",
      "Mucaba", "Negage", "Nova Esperança", "Nsosso", "Puri", "Quimbele",
      "Quipedro", "Sacandica", "Sanza Pombo", "Songo", "Uíge", "Vista Alegre",
    ],
  },
  {
    nome: "Zaire",
    municipios: [
      "Cuimba", "Lufico", "Luvo", "M'banza Kongo", "Nóqui", "N'zeto", "Quelo",
      "Quindeje", "Serra de Canda", "Soyo", "Tomboco",
    ],
  },
];

export const PROVINCE_NAMES = PROVINCES.map(p => p.nome).sort();

export function getMunicipalities(province) {
  const prov = PROVINCES.find(p => p.nome === province);
  if (!prov || !Array.isArray(prov.municipios)) return [];
  return [...prov.municipios].sort();
}