/**
 * Interface representing a Hospital.
 * For this initial model, we are only capturing the name of the hospital.
 * More properties (e.g., location coordinates, type, contact info) could be added later if needed.
 */
export interface Hospital {
    name: string;
}

/**
 * Interface representing a SubCounty.
 * Similar to Hospital, we are starting with just the name.
 * Additional details for a sub-county can be added as requirements evolve.
 */
export interface SubCounty {
    name: string;
}

/**
 * Interface representing a County.
 * This is the primary model that aggregates information about counties,
 * their sub-counties, and associated hospitals.
 */
export interface County {
    id: number; // Unique identifier for the county (based on the provided "Code")
    name: string; // The name of the county (e.g., "Baringo")
    subCounties: SubCounty[]; // An array of SubCounty objects belonging to this county
    hospitals: Hospital[]; // An array of Hospital objects located in this county
}

/**
 * An example array of County data following the defined models.
 * This data structure can be used by your backend API (e.g., Node.js with Express)
 * to send structured responses to the frontend.
 *
 * NOTE: The data below is a parsed version of the table you provided.
 * In a real-world application, this data would likely be stored in a database
 * and retrieved dynamically.
 */
export const countyData: County[] = [
    {
        id: 30,
        name: "Baringo",
        subCounties: [{ name: "Baringo Central" }, { name: "Baringo North" }, { name: "Baringo South" }, { name: "Eldama Ravine" }, { name: "Mogotio" }, { name: "Tiaty" }],
        hospitals: [{ name: "Kabarnet District Hospital" }, { name: "Marigat Sub-District Hospital" }, { name: "Eldama Ravine District Hospital" }]
    },
    {
        id: 36,
        name: "Bomet",
        subCounties: [{ name: "Bomet Central" }, { name: "Bomet East" }, { name: "Chepalungu" }, { name: "Konoin" }, { name: "Sotik" }],
        hospitals: [{ name: "Longisa District Hospital" }]
    },
    {
        id: 39,
        name: "Bungoma",
        subCounties: [{ name: "Bumula" }, { name: "Kabuchai" }, { name: "Kanduyi" }, { name: "Kimilili" }, { name: "Mt Elgon" }, { name: "Sirisia" }, { name: "Tongaren" }, { name: "Webuye East" }, { name: "Webuye West" }],
        hospitals: [{ name: "Bungoma District Hospital" }, { name: "Kimilili District Hospital" }, { name: "Mt. Elgon District Hospital" }, { name: "Sirisia Sub-District Hospital" }, { name: "Webuye District Hospital" }]
    },
    {
        id: 40,
        name: "Busia",
        subCounties: [{ name: "Budalangi" }, { name: "Butula" }, { name: "Funyula" }, { name: "Nambele" }, { name: "Teso North" }, { name: "Teso South" }],
        hospitals: [{ name: "Busia District Hospital" }, { name: "Teso District Hospital(kocholia)" }, { name: "Alupe Sub-District Hospital" }, { name: "Khunyangu Sub-District Hospital" }, { name: "Port Victoria District Hospital" }, { name: "Sio Port District Hospital" }]
    },
    {
        id: 28,
        name: "Elgeyo-Marakwet",
        subCounties: [{ name: "Keiyo North" }, { name: "Keiyo South" }, { name: "Marakwet East" }, { name: "Marakwet West" }],
        hospitals: [{ name: "Tot Sub-District Hospital" }, { name: "Chebiemit District Hospital" }, { name: "Iten District Hospital" }, { name: "Tambach Sub-District Hospital" }]
    },
    {
        id: 14,
        name: "Embu",
        subCounties: [{ name: "Manyatta" }, { name: "Mbeere North" }, { name: "Mbeere South" }, { name: "Runyenjes" }],
        hospitals: [{ name: "Embu Provincial Hospital" }, { name: "Runyenjes District Hospital" }, { name: "Siakago District Hospital" }, { name: "Ishiara Sub-District Hospital" }]
    },
    {
        id: 7,
        name: "Garissa",
        subCounties: [{ name: "Daadab" }, { name: "Fafi" }, { name: "Garissa Township" }, { name: "Hulugho" }, { name: "Ijara" }, { name: "Lagdera" }, { name: "Balambala" }],
        hospitals: [{ name: "Garissa provincial Hospital" }, { name: "Iftin Sub- District Hospital" }, { name: "Maslani District Hospital" }, { name: "Dadaab Sub-District Hospital" }, { name: "Modogashe District Hospital" }]
    },
    {
        id: 43,
        name: "Homa Bay",
        subCounties: [{ name: "Homabay Town" }, { name: "Kabondo" }, { name: "Karachwonyo" }, { name: "Kasipul" }, { name: "Mbita" }, { name: "Ndhiwa" }, { name: "Rangwe" }, { name: "Suba" }],
        hospitals: [{ name: "Suba (Sindo)District Hospital" }, { name: "Rachuonyo District Hospital" }, { name: "Kabondo Sub-District Hospital" }, { name: "Kendu bay Sub-District Hospital" }, { name: "Homabay District Hospital" }]
    },
    {
        id: 11,
        name: "Isiolo",
        subCounties: [{ name: "Isiolo" }, { name: "Merti" }, { name: "Garbatulla" }],
        hospitals: [{ name: "Isiolo District Hospital" }]
    },
    {
        id: 34,
        name: "Kajiado",
        subCounties: [{ name: "Isinya" }, { name: "Kajiado Central" }, { name: "Kajiado North" }, { name: "Loitokitok" }, { name: "Mashuuru" }],
        hospitals: [{ name: "Kajiado District Hospital" }, { name: "Ngong Sub-District Hospital" }, { name: "Loitoktok Sub-District Hospital" }]
    },
    {
        id: 37,
        name: "Kakamega",
        subCounties: [{ name: "Butere" }, { name: "Kakamega Central" }, { name: "Kakamega East" }, { name: "Kakamega North" }, { name: "Kakamega South" }, { name: "Khwisero" }, { name: "Lugari" }, { name: "Lukuyani" }, { name: "Lurambi" }, { name: "Matete" }, { name: "Mumias" }, { name: "Mutungu" }, { name: "Navakholo" }],
        hospitals: [{ name: "Kakamega Provincial General Hospital" }, { name: "Lumakanda District Hospital" }, { name: "Matunda Sub-Disrict Hospital" }, { name: "Butere District Hospital" }]
    },
    {
        id: 35,
        name: "Kericho",
        subCounties: [{ name: "Ainamoi" }, { name: "Belgut" }, { name: "Bureti" }, { name: "Kipkelion East" }, { name: "Kipkelion West" }, { name: "Soin/Sigowet" }],
        hospitals: [{ name: "Kericho District Hospital" }, { name: "Kapkatet District Hospital" }, { name: "Londiani District Hospital" }, { name: "Kipkelion Sub-District Hospital" }]
    },
    {
        id: 22,
        name: "Kiambu",
        subCounties: [{ name: "Gatundu North" }, { name: "Gatundu South" }, { name: "Githunguri" }, { name: "Juja" }, { name: "Kabete" }, { name: "Kiambaa" }, { name: "Kiambu" }, { name: "Kikuyu" }, { name: "Limuru" }, { name: "Ruiru" }, { name: "Thika Town" }, { name: "Lari" }],
        hospitals: [{ name: "Gatundu District Hospital" }, { name: "Thika District Hospital" }, { name: "Ruiru Sub-District Hospital" }, { name: "Nyathuna Sub-District hospital" }, { name: "kiambu District Hospital" }, { name: "Kihara Sub-District Hospital" }, { name: "Tigoni District Hospital" }]
    },
    {
        id: 3,
        name: "Kilifi",
        subCounties: [{ name: "Ganze" }, { name: "Kaloleni" }, { name: "Kilifi North" }, { name: "Kilifi South" }, { name: "Magarini" }, { name: "Malindi" }, { name: "Rabai" }],
        hospitals: [{ name: "Kilifi District Hospital" }, { name: "Mariakani District Hospital" }, { name: "Malindi District Hospital" }]
    },
    {
        id: 20,
        name: "Kirinyaga",
        subCounties: [{ name: "Kirinyaga Central" }, { name: "Kirinyaga East" }, { name: "Kirinyaga West" }, { name: "Mwea East" }, { name: "Mwea West" }],
        hospitals: [{ name: "Kirinyaga sub-District Hospital" }, { name: "Kimbimbi Sub-District Hospital" }, { name: "Kerugoya District Hospital" }]
    },
    {
        id: 45,
        name: "Kisii",
        subCounties: [{ name: "Nyamache" }, { name: "Gucha" }, { name: "Kisii central" }, { name: "Kisii south" }],
        hospitals: [{ name: "Nyamache District hospital" }, { name: "Gucha District Hospital" }, { name: "Iyabe Sub-District Hospital" }, { name: "Etango Sub-District Hospital" }, { name: "Ibieno Sub-District Hospital" }, { name: "Kisii District Hospital" }]
    },
    {
        id: 42,
        name: "Kisumu",
        subCounties: [{ name: "Kisumu Central" }, { name: "Kisumu East" }, { name: "Kisumu West" }, { name: "Muhoroni" }, { name: "Nyakach" }, { name: "Nyando" }, { name: "Seme" }],
        hospitals: [{ name: "Kisumu District Hospital" }, { name: "New Nyanza Provincial Hospital" }, { name: "Chulaimbo Sub-County Hospital" }, { name: "Kombewa Sub-County Hospital" }, { name: "Muhoroni Sub-County Hospital" }, { name: "Ahero Sub-County Hospital" }, { name: "Nyakach" }]
    },
    {
        id: 15,
        name: "Kitui",
        subCounties: [{ name: "Kitui West" }, { name: "Kitui Central" }, { name: "Kitui Rural" }, { name: "Kitui South" }, { name: "Kitui East" }, { name: "Mwingi North" }, { name: "Mwingi West" }, { name: "Mwingi Central" }],
        hospitals: [{ name: "Kitui District Hospital" }, { name: "Mwingi District Hospital" }, { name: "Migwani Sub-District Hospital" }]
    },
    {
        id: 2,
        name: "Kwale",
        subCounties: [{ name: "Kinango" }, { name: "Lunga Lunga" }, { name: "Msambweni" }, { name: "Matuga" }],
        hospitals: [{ name: "Kinango District Hospital" }, { name: "Msambweni District Hospital" }, { name: "Kwale District Hospital" }]
    },
    {
        id: 31,
        name: "Laikipia",
        subCounties: [{ name: "Laikipia Central" }, { name: "Laikipia East" }, { name: "Laikipia North" }, { name: "Laikipia West" }, { name: "Nyahururu" }],
        hospitals: [{ name: "Nanyuki District Hospital" }]
    },
    {
        id: 5,
        name: "Lamu",
        subCounties: [{ name: "Lamu East" }, { name: "Lamu West" }],
        hospitals: [{ name: "Mpeketoni Sub-District Hospital" }, { name: "Lamu District Hospital" }]
    },
    {
        id: 16,
        name: "Machakos",
        subCounties: [{ name: "Kathiani" }, { name: "Machakos Town" }, { name: "Masinga" }, { name: "Matungulu" }, { name: "Mavoko" }, { name: "Mwala" }, { name: "Yatta" }],
        hospitals: [{ name: "Machakos District Hospital" }, { name: "Kangundo District Hospital" }, { name: "Kathiani Hospital Hospital" }, { name: "Mwala Sub-County Hospital" }, { name: "Matuu Sub-County Hospital" }]
    },
    {
        id: 17,
        name: "Makueni",
        subCounties: [{ name: "Kaiti" }, { name: "Kibwezi West" }, { name: "Kibwezi East" }, { name: "Kilome" }, { name: "Makueni" }, { name: "Mbooni" }],
        hospitals: [{ name: "Makindu District Hospital" }, { name: "Kibwezi Sub-County Hospital" }, { name: "Makueni District Hospital" }, { name: "Mbooni District Hospital" }]
    },
    {
        id: 9,
        name: "Mandera",
        subCounties: [{ name: "Banissa" }, { name: "Lafey" }, { name: "Mandera East" }, { name: "Mandera North" }, { name: "Mandera South" }, { name: "Mandera West" }],
        hospitals: [{ name: "Elwak Sub-District Hospital" }, { name: "Mandera District Hospital" }]
    },
    {
        id: 10,
        name: "Marsabit",
        subCounties: [{ name: "Laisamis" }, { name: "Moyale" }, { name: "North Hor" }, { name: "Saku" }],
        hospitals: [{ name: "Moyale District Hospital" }, { name: "Marsabit District Hospital" }]
    },
    {
        id: 12,
        name: "Meru",
        subCounties: [{ name: "Buuri" }, { name: "Igembe Central" }, { name: "Igembe North" }, { name: "Igembe South" }, { name: "Imenti Central" }, { name: "Imenti North" }, { name: "Imenti South" }, { name: "Tigania East" }, { name: "Tigania West" }],
        hospitals: [{ name: "Chuka District Hospital" }, { name: "Githongo Sub-County Hospital" }, { name: "Nyambene District Hospital" }, { name: "Miathene District Hospital" }]
    },
    {
        id: 44,
        name: "Migori",
        subCounties: [{ name: "Awendo" }, { name: "Kuria East" }, { name: "Kuria West" }, { name: "Mabera" }, { name: "Ntimaru" }, { name: "Rongo" }, { name: "Suna East" }, { name: "Suna West" }, { name: "Uriri" }],
        hospitals: [{ name: "Kehancha District Hospital" }, { name: "Isebania Sub-District Hospital" }, { name: "Migori District Hospital" }, { name: "Rongo Sub District Hospital" }]
    },
    {
        id: 1,
        name: "Mombasa",
        subCounties: [{ name: "Changamwe" }, { name: "Jomvu" }, { name: "Kisauni" }, { name: "Likoni" }, { name: "Mvita" }, { name: "Nyali" }],
        hospitals: [{ name: "Port Reitz District Hospital" }, { name: "Tudor Sub-County Hospital" }, { name: "Coast District Hospital" }, { name: "Likoni Sub-District Hospital" }]
    },
    {
        id: 21,
        name: "Murang’a",
        subCounties: [{ name: "Gatanga" }, { name: "Kahuro" }, { name: "Kandara" }, { name: "Kangema" }, { name: "Kigumo" }, { name: "Kiharu" }, { name: "Mathioya" }, { name: "Murang’a South" }],
        hospitals: [{ name: "kangema Sub-District Hospital" }, { name: "Murang`a District Hospital" }, { name: "Muriranjas District Hospital" }, { name: "Maragwa Distric Hospital" }]
    },
    {
        id: 47,
        name: "Nairobi",
        subCounties: [{ name: "Dagoretti North" }, { name: "Dagoretti South" }, { name: "Embakasi Central" }, { name: "Embakasi East" }, { name: "Embakasi North" }, { name: "Embakasi South" }, { name: "Embakasi West" }, { name: "Kamukunji" }, { name: "Kasarani" }, { name: "Kibra" }, { name: "Lang’ata" }, { name: "Makadara" }, { name: "Mathare" }, { name: "Roysambu" }, { name: "Ruaraka" }, { name: "Starehe" }, { name: "Westlands" }],
        hospitals: [{ name: "Mbagathi District Hospital" }, { name: "Spinal injury Hospital" }, { name: "Kayole 11Sub- District Hospital" }, { name: "Mathari mental Hospital" }]
    },
    {
        id: 32,
        name: "Nakuru",
        subCounties: [{ name: "Bahati" }, { name: "Gilgil" }, { name: "Kuresoi North" }, { name: "Kuresoi South" }, { name: "Molo" }, { name: "Naivasha" }, { name: "Nakuru Town East" }, { name: "Nakuru Town West" }, { name: "Njoro" }, { name: "Rongai" }, { name: "Subukia" }],
        hospitals: [{ name: "Nakuru provincial Hospital" }, { name: "Olenguruone Sub-District Hospital" }, { name: "Molo Sub-District Hospital" }, { name: "Elburgon Nyayo Sub-District Hospital" }, { name: "Naivasha Sub-District Hospital" }, { name: "Gilgil Sub-District Hospital" }, { name: "Bahati District Hospital" }]
    },
    {
        id: 29,
        name: "Nandi",
        subCounties: [{ name: "Aldai" }, { name: "Chesumei" }, { name: "Emgwen" }, { name: "Mosop" }, { name: "Nandi Hills" }, { name: "Tindiret" }],
        hospitals: [{ name: "Kapsabet District Hospital" }, { name: "Nandi Hills District Hospital" }]
    },
    {
        id: 33,
        name: "Narok",
        subCounties: [{ name: "Narok East" }, { name: "Narok North" }, { name: "Narok South" }, { name: "Narok West" }, { name: "Transmara East" }, { name: "Transmara West" }],
        hospitals: [{ name: "Kilgoris District Hospital" }, { name: "Narok District Hospital" }]
    },
    {
        id: 46,
        name: "Nyamira",
        subCounties: [{ name: "Borabu" }, { name: "Manga" }, { name: "Masaba North" }, { name: "Nyamira North" }, { name: "Nyamira South" }],
        hospitals: [{ name: "Nyamira District Hospital" }, { name: "Manga Sub-County Hospital" }, { name: "Keroka Sub-County Hospital" }]
    },
    {
        id: 18,
        name: "Nyandarua",
        subCounties: [{ name: "Kinangop" }, { name: "Kipipiri" }, { name: "Ndaragwa" }, { name: "Ol-Kalou" }, { name: "Ol Joro Orok" }],
        hospitals: [{ name: "Engineer District Hospital" }, { name: "Ol`kalou District Hospital" }, { name: "Nyahururu District Hospital" }]
    },
    {
        id: 19,
        name: "Nyeri",
        subCounties: [{ name: "Kieni East" }, { name: "Kieni West" }, { name: "Mathira East" }, { name: "Mathira West" }, { name: "Mukurweini" }, { name: "Nyeri Town" }, { name: "Othaya" }, { name: "Tetu" }],
        hospitals: [{ name: "Karatina District Hospital" }, { name: "Mukurweini Sub-District hospital" }, { name: "Nyeri provincial General hospital" }, { name: "Mt. kenya Sub-district Hospital" }, { name: "Othaya District Hospital" }]
    },
    {
        id: 25,
        name: "Samburu",
        subCounties: [{ name: "Samburu East" }, { name: "Samburu North" }, { name: "Samburu West" }],
        hospitals: [{ name: "Maralal District Hospital" }, { name: "Baragoi Sub-District Hospital" }]
    },
    {
        id: 41,
        name: "Siaya",
        subCounties: [{ name: "Alego Usonga" }, { name: "Bondo" }, { name: "Gem" }, { name: "Rarieda" }, { name: "Ugenya" }, { name: "Unguja" }],
        hospitals: [{ name: "Bondo District Hospital" }, { name: "Siaya District Hospital" }, { name: "Yala Sub-District Hospital" }, { name: "Madiany Sub-District Hospital" }]
    },
    {
        id: 6,
        name: "Taita-Taveta",
        subCounties: [{ name: "Mwatate" }, { name: "Taveta" }, { name: "Voi" }, { name: "Wundanyi" }],
        hospitals: [{ name: "Mwatate Sub-District Hospital" }, { name: "Wesu District Hospital" }, { name: "Wundanyi Sub-District Hospital Hospital" }, { name: "Taveta District Hospital" }, { name: "Moi(voi)istrict Hospital" }]
    },
    {
        id: 4,
        name: "Tana River",
        subCounties: [{ name: "Bura" }, { name: "Galole" }, { name: "Garsen" }],
        hospitals: [{ name: "Hola District Hospital" }, { name: "Ngao District Hospital" }]
    },
    {
        id: 13,
        name: "Tharaka-Nithi",
        subCounties: [{ name: "Tharaka North" }, { name: "Tharaka South" }, { name: "Chuka" }, { name: "Igambango’mbe" }, { name: "Maara" }, { name: "Chiakariga and Muthambi" }],
        hospitals: [{ name: "Magutini Sub-District Hospital" }, { name: "Tharaka(marimanti)District Hospital" }]
    },
    {
        id: 26,
        name: "Trans-Nzoia",
        subCounties: [{ name: "Cherangany" }, { name: "Endebess" }, { name: "Kiminini" }, { name: "Kwanza" }, { name: "Saboti" }],
        hospitals: [{ name: "Kitale District Hospital" }, { name: "Saboti Sub-District Hospital" }]
    },
    {
        id: 23,
        name: "Turkana",
        subCounties: [{ name: "Loima" }, { name: "Turkana Central" }, { name: "Turkana East" }, { name: "Turkana North" }, { name: "Turkana South" }],
        hospitals: [{ name: "Lodwar District Hospital" }, { name: "Loping District Hospital" }]
    },
    {
        id: 27,
        name: "Uasin Gishu",
        subCounties: [{ name: "Ainabkoi" }, { name: "Kapseret" }, { name: "Kesses" }, { name: "Moiben" }, { name: "Soy" }, { name: "Turbo" }],
        hospitals: [{ name: "Huruma District Hospital" }]
    },
    {
        id: 38,
        name: "Vihiga",
        subCounties: [{ name: "Emuhaya" }, { name: "Hamisi" }, { name: "Luanda" }, { name: "Sabatia" }, { name: "Vihiga" }],
        hospitals: [{ name: "Vihiga District Hospital" }]
    },
    {
        id: 8,
        name: "Wajir",
        subCounties: [{ name: "Eldas" }, { name: "Tarbaj" }, { name: "Wajir East" }, { name: "Wajir North" }, { name: "Wajir South" }, { name: "Wajir West" }],
        hospitals: [{ name: "Wajir District Hospital" }, { name: "Haba sweni Sub-District" }]
    },
    {
        id: 24,
        name: "West Pokot",
        subCounties: [{ name: "Central Pokot" }, { name: "North Pokot" }, { name: "Pokot South" }, { name: "West Pokot" }],
        hospitals: [{ name: "Kapenguria District Hospital" }, { name: "Kacheliba Sub-District Hospital" }]
    }
];