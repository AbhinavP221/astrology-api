async function generateReport() {

  try {

    document.getElementById("result").innerHTML =
      "<p>Generating report...</p>";

    const dob =
      document.getElementById("dob").value;

    const tob =
      document.getElementById("tob").value;

    const city =
      document.getElementById("city").value;

    const state =
      document.getElementById("state").value;

    const country =
      document.getElementById("country").value;

    if (
      !dob ||
      !tob ||
      !city ||
      !state ||
      !country
    ) {

      document.getElementById("result").innerHTML =
        "<p>Please fill all fields.</p>";

      return;
    }

    const response = await fetch(
      `https://astrology-api-nine-omega.vercel.app/api/report?dob=${dob}&tob=${tob}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {

      document.getElementById("result").innerHTML =
        `<p>Error: ${JSON.stringify(data)}</p>`;

      return;
    }

    let rajaYoga = "Not Present";

    data.advanced.data.yoga_details.forEach(group => {

      group.yoga_list.forEach(yoga => {

        if (
          yoga.name === "Raja Yoga" &&
          yoga.has_yoga
        ) {

          rajaYoga = "Present";

        }

      });

    });

    document.getElementById("result").innerHTML = `

      <h2>Kundli Report</h2>

      <h3>Birth Details</h3>

      <p><b>Nakshatra:</b>
      ${data.birthDetails.data.nakshatra.name}</p>

      <p><b>Pada:</b>
      ${data.birthDetails.data.nakshatra.pada}</p>

      <p><b>Moon Sign:</b>
      ${data.birthDetails.data.chandra_rasi.name}</p>

      <p><b>Sun Sign:</b>
      ${data.birthDetails.data.soorya_rasi.name}</p>

      <p><b>Zodiac Sign:</b>
      ${data.birthDetails.data.zodiac.name}</p>

      <hr>

      <h3>Kaal Sarp Dosha</h3>

      <p>
      ${data.kaalSarp.data.description}
      </p>

      <hr>

      <h3>Mangal Dosha</h3>

      <p>
      ${data.advanced.data.mangal_dosha.description}
      </p>

      <hr>

      <h3>Raja Yoga</h3>

      <p>${rajaYoga}</p>

      <hr>

      <h3>Additional Information</h3>

      <p><b>Deity:</b>
      ${data.birthDetails.data.additional_info.deity}</p>

      <p><b>Ganam:</b>
      ${data.birthDetails.data.additional_info.ganam}</p>

      <p><b>Birth Stone:</b>
      ${data.birthDetails.data.additional_info.birth_stone}</p>

      <p><b>Best Direction:</b>
      ${data.birthDetails.data.additional_info.best_direction}</p>

      <p><b>Planet:</b>
      ${data.birthDetails.data.additional_info.planet}</p>

    `;

  } catch (err) {

    console.error(err);

    document.getElementById("result").innerHTML =
      `<p>Error: ${err.message}</p>`;

  }

}
