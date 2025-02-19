import { motion } from 'framer-motion';
import { Search, Scale, Book, FileText } from 'lucide-react';
import { useState } from 'react';

type Law = {
  title: string;
  description: string;
  url: string;
};

const laws: Law[] = [
  // Mantén los dos códigos originales
  {
    title: "Código Civil",
    description:
      "Base fundamental del derecho privado que regula las relaciones entre particulares en la República Dominicana. Establece las normas básicas sobre personas, bienes, obligaciones y contratos.",
    url: "https://republica-dominicana.justia.com/nacionales/codigos/codigo-civil/",
  },
  {
    title: "Código de Trabajo",
    description:
      "Marco legal que regula las relaciones laborales y los derechos de los trabajadores en la República Dominicana. Establece las normas básicas sobre contratos de trabajo, salarios, y prestaciones.",
    url: "https://republica-dominicana.justia.com/nacionales/codigos/codigo-de-trabajo-de-la-republica-dominicana/",
  },

  // A continuación se incluyen todas las leyes solicitadas, usando el mismo formato de objeto (title, description, url).
  {
    title: "Decreto No. 4807-59, Del 16 De Mayo De 1959",
    description:
      "Sobre Control De Alquileres De Casas Y Desahucios, Gaceta Oficial No. 8364, Del 29 De Mayo De 1959",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/decreto-no-4807-59-del-16-de-mayo-de-1959/gdoc/",
  },
  {
    title: "Ley 1-08",
    description: "Sobre Consejo Nacional Para Las Comunidades Dominicanas En El Exterior",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-1-08/gdoc/",
  },
  {
    title: "Ley 10-04",
    description: "Sobre La Cámara De Cuentas",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-10-04/gdoc/",
  },
  {
    title: "Ley 10-07",
    description:
      "Que Instituye El Sistema Nacional De Control Interno Y De La Contraloría General De La República",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-10-07/gdoc/",
  },
  {
    title: "Ley 108-05",
    description: "Sobre Registro Inmobiliario (Modificada)",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-108-05/gdoc/",
  },
  {
    title: "Ley 114-99",
    description:
      "Que Modifica La Ley No. 241 De 1967 De Tránsito De Vehículos",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-114-99/gdoc/",
  },
  {
    title: "Ley 12-06",
    description: "Sobre Salud Mental",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-12-06/gdoc/",
  },
  {
    title: "Ley 12-07",
    description:
      "Establece Que Las Multas O Sanciones Pecuniarias Para Las Diferentes Infracciones, Sean Crímenes O Delitos, Cuya Cuantía...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-12-07/gdoc/",
  },
  {
    title: "Ley 122-05",
    description:
      "Para La Regulación Y Fomento De Las Asociaciones Sin Fines De Lucro En La República Dominicana",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-122-05/gdoc/",
  },
  {
    title: "Ley 126-02",
    description:
      "Sobre Comercio Electrónico, Documentos Y Firmas Digitales",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-126-02/gdoc/",
  },
  {
    title: "Ley 13-07",
    description: "Que Crea El Tribunal Contencioso Tributario Y Administrativo",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-13-07/gdoc/",
  },
  {
    title: "Ley 1306-Bis De Fecha 21 De Mayo De 1937",
    description: "Sobre Divorcio",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-1306-bis-de-fecha-21-de-mayo-de-1937/gdoc/",
  },
  {
    title: "Ley 136-03",
    description:
      "Código Para El Sistema De Protección Y Los Derechos Fundamentales De Niños, Niñas Y Adolescentes",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-136-03/gdoc/",
  },
  {
    title: "Ley 137-03",
    description:
      "Del 7 De Agosto De 2003, Sobre Tráfico Ilícito De Migrantes Y Trata De Personas. Publicada En La G. O. No. 10233 Del 8...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-137-03/gdoc/",
  },
  {
    title: "Ley 139-97",
    description:
      "Mediante El Cual Los Días Feriados Del Calendario Que Coincidan Con Los Día Martes Y Miércoles, Jueves O Viernes Serán...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-139-97/gdoc/",
  },
  {
    title: "Ley 14-94",
    description:
      "Reglamento Aplicación Código Para La Protección De Niños, Niñas Y Adolescentes",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-14-94/gdoc/",
  },
  {
    title: "Ley 141-02",
    description: "De Modificación A Ley De Organización Judicial",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-141-02/gdoc/",
  },
  {
    title: "Ley 146-02",
    description:
      "Sobre Seguros Y Fianzas De La República Dominicana",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-146-02/gdoc/",
  },
  {
    title: "Ley 153-98",
    description: "Ley General De Las Telecomunicaciones",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-153-98/gdoc/",
  },
  {
    title: "Ley 156-97",
    description:
      "Que Modifica La Ley Orgánica De La Suprema Corte De Justicia, No. 25-91",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-156-97/gdoc/",
  },
  {
    title: "Ley 157-09",
    description:
      "Sobre El Seguro Agropecuario En La República Dominicana",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-157-09/gdoc/",
  },
  {
    title: "Ley 16-95",
    description: "Sobre Inversión Extranjera",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-16-95/gdoc/",
  },
  {
    title: "Ley 169-97",
    description: "Ley Orgánica Del Consejo Nacional De La Magistratura",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-169-97/gdoc/",
  },
  {
    title: "Ley 170-07",
    description:
      "Que Instituye El Sistema De Presupuesto Participativo Municipal, Del 13 De Julio Del 2007. Gaceta Oficial No. 10425 Del...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-170-07/gdoc/",
  },
  {
    title: "Ley 171-07",
    description:
      "Sobre Incentivos Especiales A Los Pensionados Y Rentistas De Fuente Extranjera, Del 13 De Julio Del 2007. Gaceta Oficial...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-171-07/gdoc/",
  },
  {
    title: "Ley 172-07",
    description:
      "Que Reduce La Tasa Del Impuesto Sobre La Renta, Del 17 De Julio Del 2007. Gaceta Oficial No. 10425 Del 19 De Julio Del 2...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-172-07/gdoc/",
  },
  {
    title: "Ley 173-07",
    description: "De Eficiencia Recaudatoria. G.o. No. 10425",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-173-07/gdoc/",
  },
  {
    title: "Ley 174-07",
    description:
      "Para La Emisión De Un Aval Financiero Como Garantía A Los Préstamos Otorgados Por Los Bancos Comerciales A Las Empresas...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-174-07/gdoc/",
  },
  {
    title: "Ley 174-09",
    description:
      "Del 3 De Junio De 2009, Que Introduce Modificaciones A La Ley De Tránsito De Vehículos, No. 241 Del 1967, Y Sus Modificaciones;...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-174-09/gdoc/",
  },
  {
    title: "Ley 175-07",
    description:
      "Sobre Reducción De Tasas Para El Sector De Bebidas Alcohólicas Y Tabaco. G.o. No. 10425",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-175-07/gdoc/",
  },
  {
    title: "Ley 176-07",
    description:
      "Del Distrito Nacional Y Los Municipios, Del 17 De Julio Del 2007. Gaceta Oficial No. 10426 Del 20 De Julio Del 2007",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-176-07/gdoc/",
  },
  {
    title: "Ley 177-09",
    description:
      "Que Otorga Amnistía A Todos Los Empleadores Públicos Y Privados, Sean Personas Físicas O Morales, Con Atrasos U Omisiones...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-177-09/gdoc/",
  },
  {
    title: "Ley 178-09",
    description:
      "Ley No. 178-09 Que Modifica Las Partes Capitales De Los Artículos 515 Y 521 De La Ley General De Las Sociedades Comerciales...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-178-09/gdoc/",
  },
  {
    title: "Ley 179-09",
    description:
      "Que Permite A Las Personas Físicas, Excepto Negocios De Único Dueño, Declarantes Del Impuesto Sobre La Renta, Para Que...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-179-09/gdoc/",
  },
  {
    title: "Ley 18-88",
    description:
      "Que Establece El “impuesto Sobre Las Viviendas Suntuarias Y Los Solares Urbanos No Edificados”",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-18-88/gdoc/",
  },
  {
    title: "Ley 181-09",
    description:
      "Que Introduce Modificaciones A La Ley No. 50-87, De Fecha 4 De Junio De 1987, Sobre Cámaras Oficiales De Comercio Y Producción...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-181-09/gdoc/",
  },
  {
    title: "Ley 182-09",
    description:
      "Ley No. 182-09 Que Modifica Los Artículos 309 Y 383 Del Código Tributario De La República Dominicana, No. 11-92, De Fecha...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-182-09/gdoc/",
  },
  {
    title: "Ley 183-02",
    description: "Que Instituye El Código Monetario Y Financiero",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-183-02/gdoc/",
  },
  {
    title: "Ley 186-07",
    description:
      "Que Introduce Modificaciones A La Ley General De Electricidad, No. 125-01, De Fecha 26 De Junio De 2001. Gaceta Oficial...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-186-07/gdoc/",
  },
  {
    title: "Ley 187-07",
    description:
      "Dispone Que Las Sumas Recibidas Y Aceptadas Cada Año Por Los Trabajadores Hasta El Primero De Enero De 2005, Se Consideraran...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-187-07/gdoc/",
  },
  {
    title: "Ley 188-07",
    description:
      "Que Introduce Modificaciones A La Ley No. 87-01, Que Crea El Sistema Dominicano De Seguridad Social, Gaceta Oficial No....",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-188-07/gdoc/",
  },
  {
    title: "Ley 189-01",
    description:
      "Que Modifica Y Deroga Varios Artículos Del Capítulo Ii, Título V, Del Código Civil De La República Dominicana, Del...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-189-01/gdoc/",
  },
  {
    title: "Ley 189-07",
    description:
      "Que Facilita El Pago A Los Empleadores Con Deudas Pendientes Con El Sistema Dominicano De Seguridad Social, Gaceta Oficial...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-189-07/gdoc/",
  },
  {
    title: "Ley 19-2000",
    description: "Sobre Mercado De Valores",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-19-2000/gdoc/",
  },
  {
    title: "Ley 194-04",
    description:
      "Sobre Autonomía Presupuestaria Y Administrativa Del Ministerio Público Y De La Cámara De Cuentas De La República Dominicana...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-194-04/gdoc/",
  },
  {
    title: "Ley 2-07",
    description:
      "Que Modifica El Art. 189 De La Ley No. 65-00, Sobre Derecho De Autor, Modificado Últimamente Por El Art. 4 De La Ley No....",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-2-07/gdoc/",
  },
  {
    title: "Ley 20-00",
    description:
      "Sobre Propiedad Industrial, Del 8 De Mayo De 2000. Publicado En G.o. No. 10044 Del 10 De Mayo De 2000. Modificada Por Las...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-20-00/gdoc/",
  },
  {
    title: "Ley 200-04",
    description:
      "Ley General De Libre Acceso A La Información Pública. Ver Reglamento De Aplicación",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-200-04/gdoc/",
  },
  {
    title: "Ley 202-04",
    description: "Ley Sectorial De Areas Protegidas",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-202-04/gdoc/",
  },
  {
    title: "Ley 218-07",
    description: "Gaceta Oficial No. 10428, Del 20 De Agosto De 2007",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-218-07/gdoc/",
  },
  {
    title: "Ley 221-07",
    description:
      "Que Designa Con El Nombre De Máximo Manuel Puello Renville, El Palacio De Justicia De La Ciudad De San Cristóbal. G.o....",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-221-07/gdoc/",
  },
  {
    title: "Ley 222-07",
    description:
      "Que Modifica El Artículo 78 De La Ley General De Educación, No. 66-97, De Fecha 9 De Abril De 1997. G.o. 10434 Del 18...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-222-07/gdoc/",
  },
  {
    title: "Ley 225-07",
    description:
      "Que Modifica El Art. 9 De La Ley No. 241 Del Año 1967, Sobre Tránsito De Vehículos, Modificado Por Las Leyes Nos. 56-89...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-225-07/gdoc/",
  },
  {
    title: "Ley 227-06",
    description:
      "Que Otorga Personalidad Jurídica Y Autonomía Funcional, Presupuestaria, Administrativa, Técnica Y Patrimonio Propio A...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-227-06/gdoc/",
  },
  {
    title: "Ley 2334",
    description: "De Registro De Los Actos Civiles, Judiciales Y Extrajudiciales",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-2334/gdoc/",
  },
  {
    title: "Ley 24-97",
    description:
      "Que Introduce Modificaciones Al Código Penal, Al Código De Procedimiento Criminal Y Al Código Para La Protección De...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-24-97/gdoc/",
  },
  {
    title: "Ley 241-67",
    description: "Sobre Tránsito De Vehículos",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-241-67/gdoc/",
  },
  {
    title: "Ley 25-91",
    description: "Orgánica De La Suprema Corte De Justicia",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-25-91/gdoc/",
  },
  {
    title: "Ley 277-04",
    description: "Sobre El Servicio Nacional De La Defensa Pública",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-277-04/gdoc/",
  },
  {
    title: "Ley 278-04",
    description:
      "Sobre La Implementación Del Procesal Penal Instituido Por La Ley No. 76-02",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-278-04/gdoc/",
  },
  {
    title: "Ley 285-04",
    description:
      "General De Migración. Publicada En Gaceta Oficial No. 10291 Del 27 De Agosto De 2004",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-285-04/gdoc/",
  },
  {
    title: "Ley 2859-51",
    description: "Sobre Cheques",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-2859-51/gdoc/",
  },
  {
    title: "Ley 288-04",
    description: "Sobre Reforma Tributaria 2004",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-288-04/gdoc/",
  },
  {
    title: "Ley 288-05",
    description:
      "Que Regula Las Sociedades De Intermediación Crediticia Y De Protección Al Titular De La Información",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-288-05/gdoc/",
  },
  {
    title: "Ley 2914",
    description: "Sobre Registro Y Conservación De Hipotecas",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-2914/gdoc/",
  },
  {
    title: "Ley 3-02",
    description: "Sobre Registro Mercantil",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-3-02/gdoc/",
  },
  {
    title: "Ley 301-64 De Fecha 31 De Junio De 1964",
    description: "Sobre Notariado",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-301-64-de-fecha-31-de-junio-de-1964/gdoc/",
  },
  {
    title: "Ley 327-98",
    description: "Sobre Carrera Judicial",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-327-98/gdoc/",
  },
  {
    title: "Ley 340-06",
    description:
      "Sobre Compras Y Contrataciones De Bienes, Servicios, Obras Y Concesiones",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-340-06/gdoc/",
  },
  {
    title: "Ley 341-09",
    description:
      "Del 26 De Noviembre De 2009, Que Introduce Modificaciones A La Ley No. 176-07 Del 17 De Julio De 2007, Del Distrito Nacional...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-341-09/gdoc/",
  },
  {
    title: "Ley 351-67",
    description:
      "Autoriza La Expedición De Licencia A Establecimiento De Casas De Juego De Azar Del 7 De Marzo De 1967, G. O., 9025 Y Sus...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-351-67/gdoc/",
  },
  {
    title: "Ley 358-05",
    description: "Sobre Protección De Los Derechos Del Consumidor O Usuario",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-358-05/gdoc/",
  },
  {
    title: "Ley 36-00",
    description:
      "Que Modifica Los Artículos 311 Y 401 Del Código Penal Dominicano",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-36-00/gdoc/",
  },
  {
    title: "Ley 3726-53",
    description: "Sobre Procedimiento De Casación",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-3726-53/gdoc/",
  },
  {
    title: "Ley 38-62",
    description: "Que Establece La Tarifa De Los Alquileres",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-38-62/gdoc/",
  },
  {
    title: "Ley 38-98",
    description:
      "Que Modifica La Parte Capital Del Artículo Primero Y Sus Párrafos 1, 2, 3, 4, 6 Y 8 Del Código Del Procedimiento Civil,...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-38-98/gdoc/",
  },
  {
    title: "Ley 392-07",
    description:
      "Sobre Competitividad E Innovación Industrial, Del 4 De Diciembre De 2007, Gaceta Oficial No. 10448, Del 6 De Diciembre...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-392-07/gdoc/",
  },
  {
    title: "Ley 4-07",
    description:
      "Que Modifica El Art. 29 De La Ley No. 495, De Fecha 28 De Diciembre De 2006, Sobre Rectificación Fiscal",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-4-07/gdoc/",
  },
  {
    title: "Ley 41-08",
    description:
      "Sobre La Función Pública Y Crea La Secretaria De Administración Pública",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-41-08/gdoc/",
  },
  {
    title: "Ley 42-00",
    description:
      "General Sobre La Discapacidad En La República Dominicana, Del 29 De Junio De 2000. Publicada En La G. O. No. 10049,...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-42-00/gdoc/",
  },
  {
    title: "Ley 42-01",
    description: "Ley General De Salud",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-42-01/gdoc/",
  },
  {
    title: "Ley 42-08",
    description: "Sobre La Defensa De La Competencia",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-42-08/gdoc/",
  },
  {
    title: "Ley 424-06",
    description:
      "De Implementación Del Tratado De Libre Comercio, Entre La República Dominicana, Centroamérica Y Los Estados Unidos De...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-424-06/gdoc/",
  },
  {
    title: "Ley 427-07",
    description: "Que Crea Un Juzgado De Paz En El Municipio De Los Alcarrizos",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-427-07/gdoc/",
  },
  {
    title: "Ley 437-06",
    description:
      "Que Establece El Recurso De Amparo, Gaceta Oficial No. 10396",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-437-06/gdoc/",
  },
  {
    title: "Ley 448-06",
    description: "Sobre Soborno En El Comercio Y La Inversión",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-448-06/gdoc/",
  },
  {
    title: "Ley 449-06",
    description:
      "Que Modifica La Ley No. 340-06 Sobre Contrataciones De Bienes, Obras, Servicios Y Concesiones",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-449-06/gdoc/",
  },
  {
    title: "Ley 450-06",
    description:
      "Sobre Protección De Los Derechos Del Obtentor De Variedades Vegetales",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-450-06/gdoc/",
  },
  {
    title: "Ley 46-97",
    description:
      "Que Consagra La Autonomía Presupuestaria Administrativa Del Poder Legislativo Y Poder Judicial",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-46-97/gdoc/",
  },
  {
    title: "Ley 479-08",
    description:
      "Sobre Las Sociedades Comerciales Y Empresas Individuales De Responsabilidad Limitada",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-479-08/gdoc/",
  },
  {
    title: "Ley 480-08",
    description:
      "De Zonas Financieras Internacionales En La República Dominicana, Del 11 De Diciembre De 2008. G.o. No. 10498 De Fecha 15...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-480-08/gdoc/",
  },
  {
    title: "Ley 488-08",
    description:
      "Que Establece Un Régimen Regulatorio Para El Desarrollo Y Competitividad De Las Micro, Pequeñas Y Medianas Empresas (Mipymes)...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-488-08/gdoc/",
  },
  {
    title: "Ley 489-08",
    description:
      "Sobre Arbitraje Comercial. Publicada En G. O. No. 10502, Del 30 De Diciembre De 2008",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-489-08/gdoc/",
  },
  {
    title: "Ley 491-06",
    description: "Ley De Aviación Civil De La República Dominicana",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-491-06/gdoc/",
  },
  {
    title: "Ley 491-08",
    description:
      "Del 19 De Diciembre De 2008, Que Modifica Los Artículos 5, 12 Y 20, De La Ley No. 3726 Del 1953, Sobre Procedimiento De...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-491-08/gdoc/",
  },
  {
    title: "Ley 492-08",
    description:
      "Del 19 De Diciembre De 2008, Que Establece Un Nuevo Procedimiento Para La Transferencia De Vehículos De Motor. Gaceta Oficial...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-492-08/gdoc/",
  },
  {
    title: "Ley 493-06",
    description:
      "Que Modifica Los Artículos 6, 49, 58 Y 62 De La Ley No. 424-06, De Fecha 20 De Noviembre De 2006, Sobre La Implementación...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-493-06/gdoc/",
  },
  {
    title: "Ley 494-06",
    description: "Ley De Organización De La Secretaría De Estado De Hacienda",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-494-06/gdoc/",
  },
  {
    title: "Ley 495-06",
    description: "Ley De Rectificación Tributaria",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-495-06/gdoc/",
  },
  {
    title: "Ley 496-06",
    description:
      "Que Crea La Secretaría De Estado De Economía, Planificación Y Desarrollo (Seepyd)",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-496-06/gdoc/",
  },
  {
    title: "Ley 497-06",
    description: "Sobre Austeridad En El Sector Público",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-497-06/gdoc/",
  },
  {
    title: "Ley 498-06",
    description: "De Planificación E Inversión Pública",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-498-06/gdoc/",
  },
  {
    title: "Ley 5-07",
    description:
      "Que Crea El Sistema Integrado De Administración Financiera Del Estado",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-5-07/gdoc/",
  },
  {
    title: "Ley 50-00",
    description:
      "(Que Modifica Los Literales A) Y B) Del Párrafo I Del Artículo 1 De La Ley No. 248 Del 1981)",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-50-00/gdoc/",
  },
  {
    title: "Ley 502-08",
    description:
      "Del Libro Y Bibliotecas. Publicada En G. O. No. 10502 Del 30 De Diciembre De 2008",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-502-08/gdoc/",
  },
  {
    title: "Ley 5038",
    description:
      "Que Instituye Un Sistema Especial Para La Propiedad, Por Pisos O Departamentos",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-5038/gdoc/",
  },
  {
    title: "Ley 51-07",
    description:
      "Que Modifica La Ley No.108-05, Del 23 De Marzo Del 2005, Sobre Registro Inmobiliario",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-51-07/gdoc/",
  },
  {
    title: "Ley 52-07",
    description:
      "Que Modifica Los Artículos 174, 176, 178, 181, 187, 192, 194, 195, 197 Y 198 De La Ley No. 136-03, Del 7 De Agosto Del...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-52-07/gdoc/",
  },
  {
    title: "Ley 53-07",
    description: "Contra Crímenes Y Delitos De Alta Tecnología",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-53-07/gdoc/",
  },
  {
    title: "Ley 55-93",
    description:
      "Sobre El Síndrome De Inmunodeficiencia Adquirida (Sida)",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-55-93/gdoc/",
  },
  {
    title: "Ley 57-07",
    description:
      "Sobre Incentivo Al Desarrollo De Fuentes Renovables De Energía Y De Sus Regímenes Especiales. Publicada En La G. O. No....",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-57-07/gdoc/",
  },
  {
    title: "Ley 6-06",
    description: "Sobre Crédito Público",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-6-06/gdoc/",
  },
  {
    title: "Ley 6186-63",
    description: "Sobre Fomento Agrícola",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-6186-63/gdoc/",
  },
  {
    title: "Ley 62-00 De Fecha 3 De Agostyo De 2000",
    description:
      "Que Modifica Los Artículos 66 Y 68 De La Ley De Cheques, No.2859 Del Año 1951",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-62-00-de-fecha-3-de-agostyo-de-2000/gdoc/",
  },
  {
    title: "Ley 64-00",
    description: "De Medio Ambiente",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-64-00/gdoc/",
  },
  {
    title: "Ley 65-00",
    description:
      "Modificada Por Las Leyes No. 424-06 De Implementación Del (Dr-Cafta) Del 20 De Noviembre De 2006, Ley No. 493-06 Del 22...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-65-00/gdoc/",
  },
  {
    title: "Ley 659-44",
    description:
      "Sobre Actos Del Estado Civil Que Dicta Disposiciones Sobre Los Registros Y Las Actas De Defunción",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-659-44/gdoc/",
  },
  {
    title: "Ley 716",
    description:
      "Sobre Las Funciones Públicas De Los Cónsules Dominicanos",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-716/gdoc/",
  },
  {
    title: "Ley 72-02",
    description:
      "Contra El Lavado De Activos Procedentes Del Tráfico Ilícito De Drogas Y Sustancias Controladas Y Otras Infracciones Gr...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-72-02/gdoc/",
  },
  {
    title: "Ley 73-2010",
    description:
      "Que Modifica Los Arts. 515, 521 Y 523 De La Ley General De Sociedades Comerciales Y Empresas Individuales De Responsabilidad...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-73-2010/gdoc/",
  },
  {
    title: "Ley 76-02",
    description:
      "Que Crea El Código Procesal Penal De La República Dominicana",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-76-02/gdoc/",
  },
  {
    title: "Ley 78-03",
    description: "Que Crea El Estatuto Del Ministerio Público",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-78-03/gdoc/",
  },
  {
    title: "Ley 8-90",
    description: "Sobre Fomento De Zonas Francas",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-8-90/gdoc/",
  },
  {
    title: "Ley 821-27",
    description: "Sobre Organización Judicial",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-821-27/gdoc/",
  },
  {
    title: "Ley 834",
    description:
      "Ley No. 834, Que Abroga Y Modifica Ciertas Disposiciones En Materia De Procedimiento Civil Y Hace Suyas Las Mas Recientes...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-834/gdoc/",
  },
  {
    title: "Ley 845",
    description:
      "Que Modifica Varios Artículos Del Código De Procedimiento Civil, Encaminados A Acortar Los Plazos Para Interponer Los...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-845/gdoc/",
  },
  {
    title: "Ley 86-89",
    description:
      "Que Modifica Los Artículos 1 Y 67 De La Ley Del Notario No. 301 Del 18 De Junio De 1964",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-86-89/gdoc/",
  },
  {
    title: "Ley 88-03",
    description:
      "Del 1 De Mayo De 2003, Que Instituye Las Casas De Acogidas O Refugios, En Todo El Territorio Nacional Para Albergar Mujeres,...",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-88-03/gdoc/",
  },
  {
    title: "Ley 89-05",
    description:
      "Del 24 De Febrero De 2005. G. O. No. 10313, Del 15 De Marzo De 2005",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-89-05/gdoc/",
  },
  {
    title: "Ley 91-83",
    description:
      "Legislación Sobre El Colegio De Abogados, Que Instituye El Colegio De Abogados De La República Dominicana",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-91-83/gdoc/",
  },
  {
    title: "Ley 96-04",
    description: "Ley Institucional De La Policía",
    url: "https://republica-dominicana.justia.com/nacionales/leyes/ley-96-04/gdoc/",
  },
];

export function Laws() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLaws = laws.filter((law) =>
    law.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    law.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Biblioteca de Leyes
          </h2>
          <div className="relative w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar leyes..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredLaws.map((law) => (
            <motion.div
              key={law.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-50 rounded-lg p-6 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center mb-4">
                <div className="bg-neutral-200 p-2 rounded-lg">
                  <Scale className="h-6 w-6 text-neutral-700" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-neutral-900">
                  {law.title}
                </h3>
              </div>
              <p className="text-neutral-600 mb-4 line-clamp-2">
                {law.description}
              </p>
              <a
                href={law.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-neutral-900 hover:text-neutral-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Ley Completa
              </a>
            </motion.div>
          ))}
        </div>

        {filteredLaws.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">
              No se encontraron leyes que coincidan con tu búsqueda
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
