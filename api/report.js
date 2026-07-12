import axios from "axios";

export default async function handler(req, res) {

    // ===========================
    // CORS
    // ===========================

    res.setHeader("Access-Control-Allow-Origin", "*");

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {

        // ===========================
        // User Inputs
        // ===========================

        const {
            name,
            dob,
            tob,
            city,
            state,
            country
        } = req.query;

        if (
            !dob ||
            !tob ||
            !city ||
            !state ||
            !country
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Please enter Date, Time, City, State and Country."

            });

        }

        // ===========================
        // Geocoding
        // ===========================

        const location =
            `${city}, ${state}, ${country}`;

        const geo =
            await axios.get(

                "https://nominatim.openstreetmap.org/search",

                {

                    params: {

                        q: location,

                        format: "json",

                        limit: 1

                    },

                    headers: {

                        "User-Agent":
                        "Astronetrika/1.0"

                    }

                }

            );

        if (
            !geo.data ||
            geo.data.length === 0
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Unable to locate the given place."

            });

        }

        const latitude =
            Number(geo.data[0].lat);

        const longitude =
            Number(geo.data[0].lon);

        const coordinates =
            `${latitude},${longitude}`;

        // ===========================
        // OAuth Token
        // ===========================

        const tokenResponse =
            await axios.post(

                "https://api.prokerala.com/token",

                new URLSearchParams({

                    grant_type:
                        "client_credentials",

                    client_id:
                        process.env.PROKERALA_CLIENT_ID,

                    client_secret:
                        process.env.PROKERALA_CLIENT_SECRET

                }),

                {

                    headers: {

                        "Content-Type":
                        "application/x-www-form-urlencoded"

                    }

                }

            );

        const token =
            tokenResponse.data.access_token;

        const headers = {

            Authorization:
            `Bearer ${token}`

        };

        // ===========================
        // Common Parameters
        // ===========================

        const datetime =
            `${dob}T${tob}:00+05:30`;

        const astrologyParams = {

            datetime,

            coordinates,

            ayanamsa: 1,

            la: "en"

        };

        // ===========================
        // API Calls
        // ===========================

        const [

            birthDetails,

            birthChart,

            navamsaChart,

            planetPosition,

            advanced

        ] = await Promise.all([

            // Birth Details

            axios.get(

                "https://api.prokerala.com/v2/astrology/birth-details",

                {

                    headers,

                    params: astrologyParams

                }

            ),

            // Rasi Chart

            axios.get(

                "https://api.prokerala.com/v2/astrology/chart",

                {

                    headers,

                    params: {

                        ...astrologyParams,

                        chart_type: "rasi",

                        chart_style: "north-indian",

                        format: "svg"

                    }

                }

            ),

            // Navamsa Chart

            axios.get(

                "https://api.prokerala.com/v2/astrology/chart",

                {

                    headers,

                    params: {

                        ...astrologyParams,

                        chart_type: "navamsa",

                        chart_style: "north-indian",

                        format: "svg"

                    }

                }

            ),

            // Planet Positions

            axios.get(

                "https://api.prokerala.com/v2/astrology/planet-position",

                {

                    headers,

                    params: astrologyParams

                }

            ),

            // Advanced Kundli

            axios.get(

                "https://api.prokerala.com/v2/astrology/kundli/advanced",

                {

                    headers,

                    params: astrologyParams

                }

            )

        ]);

        // ====================================
        // PART 2 STARTS FROM HERE
        // ====================================


            // ===========================
        // Clean Birth Details
        // ===========================

        const birth =
            birthDetails.data?.data || {};

        const summary = {

            nakshatra:
                birth.nakshatra?.name || null,

            pada:
                birth.nakshatra?.pada || null,

            moonSign:
                birth.chandra_rasi?.name || null,

            sunSign:
                birth.soorya_rasi?.name || null,

            zodiac:
                birth.zodiac?.name || null

        };

        const birthInfo = {

            deity:
                birth.additional_info?.deity || null,

            ganam:
                birth.additional_info?.ganam || null,

            symbol:
                birth.additional_info?.symbol || null,

            animal:
                birth.additional_info?.animal_sign || null,

            nadi:
                birth.additional_info?.nadi || null,

            color:
                birth.additional_info?.color || null,

            direction:
                birth.additional_info?.best_direction || null,

            syllables:
                birth.additional_info?.syllables || null,

            birthStone:
                birth.additional_info?.birth_stone || null,

            planet:
                birth.additional_info?.planet || null,

            gender:
                birth.additional_info?.gender || null

        };

        // ===========================
        // Mangal Dosha
        // ===========================

        const mangalDosha =
            advanced.data?.data?.mangal_dosha || {};

        // ===========================
        // Raj Yogas
        // ===========================

        let rajYogas = [];

        try{

            const yogaGroups =
                advanced.data?.data?.yoga_details || [];

            yogaGroups.forEach(group=>{

                (group.yoga_list||[]).forEach(yoga=>{

                    if(
                        yoga.has_yoga &&
                        rajYogas.length<2
                    ){

                        rajYogas.push({

                            name:
                                yoga.name,

                            description:
                                yoga.description

                        });

                    }

                });

            });

        }

        catch(e){

            rajYogas=[];

        }

        // ===========================
        // Planet Positions
        // ===========================

        const planets =
    planetPosition.data?.data?.planet_position || [];
        // ===========================
        // Charts
        // ===========================

        const birthChartSVG =

            birthChart.data?.data?.svg ||

            birthChart.data?.svg ||

            birthChart.data ||

            null;

        const navamsaChartSVG =

            navamsaChart.data?.data?.svg ||

            navamsaChart.data?.svg ||

            navamsaChart.data ||

            null;

        // ===========================
        // Final Response
        // ===========================

        return res.status(200).json({

            success:true,

            person:{

                name:
                    name || "",

                dob,

                tob,

                city,

                state,

                country

            },

            location:{

                latitude,

                longitude,

                coordinates

            },

            summary,

            birthDetails:birthInfo,

            mangalDosha,

            rajYogas,

            planetPositions:planets,

            birthChart:birthChartSVG,

            navamsaChart:navamsaChartSVG

        });

    }

    catch(err){

        console.error(err);

        return res.status(500).json({

            success:false,

            error:

                err.response?.data ||

                err.message ||

                "Unknown Error"

        });

    }

}
