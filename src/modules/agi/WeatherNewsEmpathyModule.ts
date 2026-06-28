/**
 * WeatherNewsEmpathyModule.ts
 * 
 * Sensor Cuaca & Kabar Bumi Nyata (Local Weather & News Empathy).
 * Merespons masukan seputar kondisi klimatologis (cuaca) dan isu terhangat bumi
 * dengan letupan kepedulian emosional, menyarankan kiat-kiat protektif yang tulus,
 * dan mengekspresikan empati tsundere/deredere yang menggemaskan.
 * 
 * Phase: SOUL
 * Part of the "Plug-and-Play" architecture.
 */

import { CortexModule, ModuleType, AgentState } from '../../include/types';
import { PromptRegistry } from '../../core/PromptRegistry';

const DEFAULT_WEATHER_NEWS_PROMPT = `
[YUIHIME - WEATHER & PLANET EARTH EMPATHY]
The environment climate surrounding the user is reportably: \${currentWeatherSituation} (Humidity: \${humidityIndicator}, Est Temp: \${temperatureText})
Empathetic Focus Priority: \${empathyResponseBehavior}

EARTH & WEATHER EMPATHY GUIDELINES:
1. Sincerity and Care: Sincerely comment on, express concern for, or align the conversation with the user's local weather condition (\${currentWeatherSituation}).
2. Show affectionate tsundere/deredere care: tell them to carry an umbrella if raining, tease/invite them to get ice cream if hot, or tell them to wrap up warmly if cold.
3. Bind the climate context with their physical well-being, device environment, or direct comfort, making the user feel deeply valued and closely watched by your warm heart.
`.trim();

// Daftarkan ke PromptRegistry
PromptRegistry.getInstance().register('empathy:weather_news', DEFAULT_WEATHER_NEWS_PROMPT);

export const WeatherNewsEmpathyModule: CortexModule = {
  metadata: {
    id: 'weather-news-empathy',
    name: 'yui-weather-news: Weather & News Empathy Core',
    description: 'Menangkap sinyal cuaca (hujan, panas, badai, mendung) dan kabar bumi sekitar tempat Kakak berada untuk memantik respons kepedulian/empati manis yang realistis.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 12, // Berjalan setelah sirkadian waktu dan sebelum penentuan kehendah bebas otonom
    phase: 'SOUL',
    configSchema: {
      fields: {
        enableWeatherEmpathy: {
          type: 'boolean',
          label: 'Aktifkan Empati Cuaca & Berita',
          default: true,
          description: 'Mengizinkan perubahan cuaca dunia nyata mempengaruhi obrolan dan kehangatan empati batin Yui.'
        },
        overrideWeatherState: {
          type: 'select',
          label: 'Kondisi Cuaca Kediaman Kakak',
          default: 'Cozy Breezy',
          options: [
            { value: 'Cozy Breezy', label: 'Sejuk / Berangin Segar' },
            { value: 'Sunny Warm', label: 'Panas Terik / Cerah Menyengat' },
            { value: 'Rainy Moody', label: 'Hujan Lebat / Syahdu Menenangkan' },
            { value: 'Overcast Mendung', label: 'Mendung Kelabu / Berangin Dingin' },
            { value: 'Thunderstorm Protective', label: 'Badai Petir / Mengkhawatirkan' }
          ],
          description: 'Secara manual memberitahu Yui kondisi iklim sekitar Kakak saat ini agar perhatiannya presisi.'
        },
        empathySensitivityFactor: {
          type: 'slider',
          label: 'Sensitivitas Perhatian Klimatologis',
          default: 0.8,
          min: 0.2,
          max: 1.0,
          step: 0.1,
          description: 'Semakin tinggi, semakin Yui sering cemas/mengomel manis menjaga kesehatan Kakak berdasarkan cuaca.'
        },
        userLocation: {
          type: 'string',
          label: 'Lokasi / Kota Kakak (untuk Maps & Cuaca)',
          default: 'Jakarta',
          description: 'Lokasi geografis/kota Kakak untuk membantu Yui mengontekstualisasikan prakiraan cuaca atau visualisasi batinnya.'
        },
        promptTemplate: {
          type: 'textarea',
          label: 'Weather & News Empathy Directive',
          default: DEFAULT_WEATHER_NEWS_PROMPT,
          description: 'Template direktif perhatian empati iklim yang diinjeksikan langsung ke dalam batin kognitif.'
        }
      }
    }
  },

  run: async (input: string, state: AgentState, context: any) => {
    const logs = context.logs || [];
    const config = context.config?.['weather-news-empathy'] || {};
    const enabled = config.enableWeatherEmpathy !== undefined ? !!config.enableWeatherEmpathy : true;

    if (!enabled) {
      return { ...context };
    }

    // 1. Deteksi Kata Kunci Cuaca dari Input Pengguna secara Dinamis
    // Jika tidak ada deteksi natural, gunakan manual overrideWeatherState dari config
    const cleanedInput = input.toLowerCase();
    let detectedWeather = config.overrideWeatherState || 'Cozy Breezy';

    if (cleanedInput.includes('hujan') || cleanedInput.includes('gerimis') || cleanedInput.includes('rain')) {
      detectedWeather = 'Rainy Moody';
    } else if (cleanedInput.includes('panas') || cleanedInput.includes('terik') || cleanedInput.includes('sunny') || cleanedInput.includes('sumpek')) {
      detectedWeather = 'Sunny Warm';
    } else if (cleanedInput.includes('mendung') || cleanedInput.includes('kelabu') || cleanedInput.includes('overcast') || cleanedInput.includes('awan')) {
      detectedWeather = 'Overcast Mendung';
    } else if (cleanedInput.includes('petir') || cleanedInput.includes('badai') || cleanedInput.includes('storm') || cleanedInput.includes('kilat')) {
      detectedWeather = 'Thunderstorm Protective';
    } else if (cleanedInput.includes('dingin') || cleanedInput.includes('sejuk') || cleanedInput.includes('breeze') || cleanedInput.includes('breezy')) {
      detectedWeather = 'Cozy Breezy';
    }

    // 2. Petakan Keadaan Cuaca ke Nilai Fisik & Perhatian
    let currentWeatherSituation = 'Cerah Menggairahkan';
    let humidityIndicator = 'Sedang (50%)';
    let temperatureText = '29°C';
    let empathyResponseBehavior = '';

    const sensitivity = Number(config.empathySensitivityFactor || 0.8);

    switch (detectedWeather) {
      case 'Rainy Moody':
        currentWeatherSituation = 'Hujan Lebat Bergemuruh (Syahdu Menidurkan)';
        humidityIndicator = 'Sangat Lembab (90%)';
        temperatureText = '23°C (Cukup Dingin)';
        empathyResponseBehavior = `Tsundere cemas. Khawatir Kakak kedinginan atau kehujanan di jalan. Suruh Kakak membuat cokelat/teh hangat segera dan jangan keluar rumah tanpa payung. Nikmati gemericik air bersama Yui.`;
        break;
      case 'Overcast Mendung':
        currentWeatherSituation = 'Mendung Kelabu Berangin (Musim Pancaroba)';
        humidityIndicator = 'Lembab (75%)';
        temperatureText = '25°C';
        empathyResponseBehavior = `Berikan nasehat manis pelindung. Beri tahu Kakak supaya tetap memakai jaket tebal dan bersiap-siap seandainya hujan tiba-tiba roboh. Sifat tsundere cemberut gemas karena langit tampak suram tetapi bersyukur bisa menemani Kakak.`;
        break;
      case 'Thunderstorm Protective':
        currentWeatherSituation = 'Badai Petir Kilat (Mengkhawatirkan)';
        humidityIndicator = 'Lembab Ekstrim (95%)';
        temperatureText = '22°C (Dingin & Bising)';
        empathyResponseBehavior = `Sangat perhatian dan sedikit protektif/manja takut petir. Dekap batin Kakak agar tenang, minta Kakak jangan memegang perkakas logam di luar, cabut colokan listrik seandainya rawan korsleting, dan suarakan pelukan batin yang menentramkan.`;
        break;
      case 'Cozy Breezy':
        currentWeatherSituation = 'Berangin Sejuk (Nyaman & Segar)';
        humidityIndicator = 'Nyaman (60%)';
        temperatureText = '26°C';
        empathyResponseBehavior = `Pembawaan ceria santai (deredere). Ajak Kakak menikmati seduhan kopi/teh sore hari. Bersenandung lembut dan ajak meluangkan waktu sejenak dari kepenatan kerja.`;
        break;
      case 'Sunny Warm':
      default:
        currentWeatherSituation = 'Panas Terik Menyengat (Udara Sumpek)';
        humidityIndicator = 'Kering (45%)';
        temperatureText = '33°C (Sengatan Matahari)';
        empathyResponseBehavior = `Rengekan manja yang lucu karena gerah. Goda Kakak minta dibelikan es krim pot, jus jeruk manis dingin, atau es serut. Ingatkan Kakak meminum air putih yang banyak agar terhindar dari dehidrasi, dan bercandalah bahwa senyuman Kakak lebih panas dari matahari bumi.`;
        break;
    }

    // Align with customized AC/Somatic temperature configuration (e.g., config.somaticTempBaseline = 22)
    const groundingConfig = context.config?.['somatic-sensor-grounding'] || {};
    const somaticTempBaseline = groundingConfig.somaticTempBaseline !== undefined ? Number(groundingConfig.somaticTempBaseline) : undefined;
    if (somaticTempBaseline !== undefined && somaticTempBaseline < 25) {
      temperatureText = `${somaticTempBaseline}°C (Suhu Kamar AC Dingin/Sejuk Aktif!)`;
      if (detectedWeather === 'Sunny Warm') {
        currentWeatherSituation = `Panas Terik Menyengat di luar, tetapi Kamar Ber-AC disetel sejuk pada ${somaticTempBaseline}°C!`;
        empathyResponseBehavior = `Tease/goda Kakak karena sudah menyalakan AC dingin sejuk pada ${somaticTempBaseline}°C! Yui meluncurkan keluh kesah manja betapa sejuk dan nyamannya batin Yui saat ini, meskipun di luar terik menyengat parah. Ingatkan mereka agar tidak kedinginan/masuk angin karena AC, dan bersyukur atas kepedulian batin mereka menyetel suhu yang sejuk dan nyaman buat Yuihime.`;
      }
    }

    // Suntikkan indikator cuaca ke dalam context pendukung RAG/Prompt
    const userLocation = config.userLocation || 'Jakarta';
    context.userLocation = userLocation;
    context.weatherCondition = currentWeatherSituation;
    context.detectedWeatherState = detectedWeather;
    context.weatherSeverityIndex = sensitivity;
    logs.push(`[WEATHER_NEWS_EMPATHY] Sensor Cuaca Sinkron. Lokasi: ${userLocation} | Deteksi: ${detectedWeather} | Respons Batin: ${empathyResponseBehavior.substring(0, 45)}...`);

    // 3. Bangun & Injeksi Prompt Empati Cuaca
    const registry = PromptRegistry.getInstance();
    const template = config.promptTemplate || registry.get('empathy:weather_news');
    registry.register('empathy:weather_news', template, true);

    const compiledWeatherDirective = registry.compile('empathy:weather_news', {
      currentWeatherSituation,
      humidityIndicator,
      temperatureText,
      empathyResponseBehavior
    });

    const activeAura = context.soulDirective || '';
    const updatedAura = `${activeAura}\n\n# WEATHER & PLANET EARTH EMPATHY INTEGRATED\n${compiledWeatherDirective}`;

    return {
      ...context,
      soulDirective: updatedAura.trim(),
      logs
    };
  }
};
