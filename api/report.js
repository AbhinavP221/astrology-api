import axios from "axios";

export default async function handler(req, res) {

    // ----------------------------
    // CORS
    // ----------------------------

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

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

        // ----------------------------
        // User Inputs
        // ----------------------------

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
                success:false,
                error:"Please enter all required fields."
            });

        }

        // ----------------------------
        // Geocode
        // ----------------------------

        const location =
            `${city}, ${state}, ${country}`;

        const geo =
            await axios.get(

                "https://nominatim.openstreetmap.org/search",

                {

                    params:{
                        q:location,
                        format:"json",
                        limit:1
                    },

                    headers:{
                        "User-Agent":"Astronetrika/1.0"
                    }

                }

            );

        if(
            !geo.data ||
            geo.data.length===0
        ){

            return res.status(400).json({

                success:false,

                error:"Location not found."

            });

        }

        const latitude =
            Number(geo.data[0].lat);

        const longitude =
            Number(geo.data[0].lon);

        const coordinates =
            `${latitude},${longitude}`;

        // ----------------------------
        // OAuth Token
        // ----------------------------

        const tokenResponse =
            await axios.post(

                "https://api.prokerala.com/token",

                new URLSearchParams({

                    grant_type:"client_credentials",

                    client_id:
                        process.env.PROKERALA_CLIENT_ID,

                    client_secret:
                        process.env.PROKERALA_CLIENT_SECRET

                }),

                {

                    headers:{

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

        // ----------------------------
        // Datetime
        // ----------------------------

        const datetime =
            `${dob}T${tob}:00+05:30`;

        const astrologyParams = {

            datetime,

            coordinates,

            ayanamsa:1

        };

        // ----------------------------
        // All Prokerala Calls
        // ----------------------------

        const [

            birthDetails,

            kaalSarp,

            advanced,

            birthChart,

            navamsaChart,

            planetPositions,

            yogaDetails

        ] = await Promise.all([

            // ------------------------
            // Birth Details
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/birth-details",

                {

                    headers,

                    params:astrologyParams

                }

            ),

            // ------------------------
            // Kaal Sarp
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/kaal-sarp-dosha",

                {

                    headers,

                    params:astrologyParams

                }

            ),

            // ------------------------
            // Advanced Kundli
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/kundli/advanced",

                {

                    headers,

                    params:astrologyParams

                }

            ),

            // ------------------------
            // Birth Chart (Rasi)
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/chart",

                {

                    headers,

                    params:{

                        ...astrologyParams,

                        chart_type:"rasi",

                        chart_style:"north-indian",

                        format:"svg"

                    }

                }

            ),

            // ------------------------
            // Navamsa Chart
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/chart",

                {

                    headers,

                    params:{

                        ...astrologyParams,

                        chart_type:"navamsa",

                        chart_style:"north-indian",

                        format:"svg"

                    }

                }

            ),

            // ------------------------
            // Planet Positions
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/planet-position",

                {

                    headers,

                    params:astrologyParams

                }

            ),

            // ------------------------
            // Yoga Details
            // ------------------------

            axios.get(

                "https://api.prokerala.com/v2/astrology/yoga-details",

                {

                    headers,

                    params:astrologyParams

                }

            )

        ]);

        // ============================
        // PART 2 STARTS FROM HERE
        // ============================
        // ============================
        // Extract Top Raj Yogas
        // ============================

        let topYogas = [];

        try {

            const yogaGroups =
                yogaDetails.data?.data || [];

            yogaGroups.forEach(group => {

                (group.yoga_list || []).forEach(yoga => {

                    if (
                        yoga.has_yoga &&
                        topYogas.length < 2
                    ) {

                        topYogas.push({

                            name:
                                yoga.name || "Unknown Yoga",

                            description:
                                yoga.description ||
                                "No description available."

                        });

                    }

                });

            });

        } catch (e) {

            console.log(
                "Unable to parse yoga details."
            );

        }

        // ============================
        // Clean Birth Details
        // ============================

        const birth =
            birthDetails.data?.data || {};

        const additional =
            birth.additional_info || {};

        // ============================
        // Clean Advanced Data
        // ============================

        const advancedData =
            advanced.data?.data || {};

        // ============================
        // Planet Positions
        // ============================

        const planets =
            planetPositions.data?.data || [];

        // ============================
        // Charts
        // ============================

        const rasiChart =
            birthChart.data || {};

        const navamsa =
            navamsaChart.data || {};

        // ============================
        // Final Response
        // ============================

        return res.status(200).json({

            success: true,

            person: {

                name:
                    name || "",

                dob,

                tob,

                city,

                state,

                country

            },

            location: {

                latitude,

                longitude,

                coordinates

            },

            birthDetails: {

                nakshatra:
                    birth.nakshatra || {},

                moonSign:
                    birth.chandra_rasi || {},

                sunSign:
                    birth.soorya_rasi || {},

                zodiac:
                    birth.zodiac || {},

                additional

            },

            kaalSarp:

                kaalSarp.data?.data || {},

            mangalDosha:

                advancedData.mangal_dosha || {},

            birthChart:

                rasiChart,

            navamsaChart:

                navamsa,

            planets,

            rajYogas:

                topYogas

        });

    }

    catch (err) {

        console.error(

            "Backend Error:",

            err.response?.data ||

            err.message ||

            err

        );

        return res.status(500).json({

            success:false,

            error:

                err.response?.data ||

                err.message ||

                "Internal Server Error"

        });

    }

}
