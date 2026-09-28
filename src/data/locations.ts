export interface CityLocation {
  city: string;
  province: string;
  areas: string[];
}

export const PAKISTAN_LOCATIONS: CityLocation[] = [
  {
    city: 'Karachi',
    province: 'Sindh',
    areas: [
      'Clifton',
      'DHA',
      'Gulshan-e-Iqbal',
      'PECHS',
      'North Nazimabad',
      'Nazimabad',
      'Johar',
      'Saddar',
      'Bahadurabad',
      'Malir Cantt',
    ],
  },
  {
    city: 'Lahore',
    province: 'Punjab',
    areas: [
      'Gulberg',
      'DHA',
      'Johar Town',
      'Model Town',
      'Bahria Town',
      'Cantt',
      'Garden Town',
      'Wapda Town',
      'Iqbal Town',
    ],
  },
  {
    city: 'Islamabad',
    province: 'ICT',
    areas: [
      'F-6',
      'F-7',
      'F-8',
      'F-10',
      'F-11',
      'G-9',
      'G-11',
      'E-11',
      'Bahria Enclave',
      'DHA Islamabad',
    ],
  },
  {
    city: 'Rawalpindi',
    province: 'Punjab',
    areas: [
      'Saddar',
      'Bahria Town',
      'Satellite Town',
      'Chaklala Scheme 3',
      'Peshawar Road',
      'Westridge',
    ],
  },
  {
    city: 'Faisalabad',
    province: 'Punjab',
    areas: [
      'Peoples Colony',
      'D Ground',
      'Madina Town',
      'Canal Road',
      'Gulberg',
      'Civil Lines',
    ],
  },
  {
    city: 'Multan',
    province: 'Punjab',
    areas: [
      'Cantt',
      'Gulgasht Colony',
      'Buch Villas',
      'Wapda Town',
      'Model Town',
      'Bosan Road',
    ],
  },
  {
    city: 'Peshawar',
    province: 'KPK',
    areas: [
      'Hayatabad',
      'University Town',
      'Saddar',
      'Cantt',
      'Warsak Road',
    ],
  },
  {
    city: 'Hyderabad',
    province: 'Sindh',
    areas: [
      'Qasimabad',
      'Latifabad',
      'Cantt',
      'Auto Bhan Road',
      'Citizen Colony',
    ],
  },
];

export const CITIES = PAKISTAN_LOCATIONS.map((loc) => loc.city);

export function getAreasForCity(city: string): string[] {
  const found = PAKISTAN_LOCATIONS.find(
    (loc) => loc.city.toLowerCase() === city.toLowerCase()
  );
  return found ? found.areas : [];
}
