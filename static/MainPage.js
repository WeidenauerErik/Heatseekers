const app = Vue.createApp({
    data() {
        return {
            temperatureChart: null,
            humidityChart: null,
            isTemperatureBarChart: false,
            isHumidityBarChart: false,
            labels: [],
            temperatureData: [],
            humidityData: [],
            dataSource: '/data/raspberrydata.txt',
            isFetchingData: false,
            intervalId: null,
            showFloodWarning: false,
            selectedTimeRange: '1 Minute',
            filteredLabels: [],
            filteredTemperatureData: [],
            filteredHumidityData: []
        };
    },
    computed: {
        temperatureChartType() {
            return this.isTemperatureBarChart ? 'bar' : 'line';
        },
        humidityChartType() {
            return this.isHumidityBarChart ? 'bar' : 'line';
        }
    },
    async mounted() {
        await this.fetchData();
        this.filterData();
        this.createChart('temperature', this.temperatureChartType, this.filteredTemperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
        this.createChart('humidity', this.humidityChartType, this.filteredHumidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');

        this.intervalId = setInterval(async () => {
            if (!this.isFetchingData) {
                console.log("Fetching new data...");
                this.isFetchingData = true;
                await this.fetchData();
                this.filterData();
                this.updateChart('temperature');
                this.updateChart('humidity');
                this.isFetchingData = false;
            }
        }, 5000);
    },
    methods: {
        async fetchData() {
            try {
                const response = await fetch(`/data/raspberrydata.txt?timestamp=${new Date().getTime()}`);
                const rawData = await response.text();

                const parsedData = rawData.trim().split('\n').slice(-120960);
                const newLabels = [];
                const newTemperatureData = [];
                const newHumidityData = [];
                let floodStatus = 0;

                parsedData.forEach(entry => {
                    const [dateTime, temperature, humidity, flood] = entry.split(';');
                    const formattedTime = dateTime.split('-')[1].replace(/_/g, ':');
                    newLabels.push(formattedTime);
                    newTemperatureData.push(parseFloat(temperature));
                    newHumidityData.push(parseFloat(humidity));
                    floodStatus = parseInt(flood);
                });

                this.showFloodWarning = floodStatus === 1;

                this.labels = newLabels;
                this.temperatureData = newTemperatureData;
                this.humidityData = newHumidityData;

                const latestTemperature = newTemperatureData[newTemperatureData.length - 1];
                const latestHumidity = newHumidityData[newHumidityData.length - 1];

                if (latestTemperature > 30 || latestHumidity > 80 || floodStatus === 1) {
                    console.log("Critical values detected, sending alert...");
                    await fetch('/send-alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            temperature: latestTemperature,
                            humidity: latestHumidity,
                            flood: floodStatus
                        })
                    });
                }

                this.filterData(); // Filter the data after fetching
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        },
        filterData() {
            let range = 0;

            if (this.selectedTimeRange === 'all') {
                range = this.labels.length; // Alle Einträge anzeigen
            } else {
                const timeMap = {
                    '1 Minute': 13, // 13 Einträge pro Minute (5-Sekunden-Intervalle)
                    '1 Stunde': 13 * 60, // 13 Einträge pro Minute * 60 Minuten
                    '1 Tag': 13 * 60 * 24, // 13 Einträge pro Minute * 60 Minuten * 24 Stunden
                };

                const numberOfEntries = timeMap[this.selectedTimeRange] || this.labels.length;
                range = Math.min(numberOfEntries, this.labels.length); // Begrenze den Bereich auf die verfügbaren Daten
            }

            this.filteredLabels = this.labels.slice(-range);
            this.filteredTemperatureData = this.temperatureData.slice(-range);
            this.filteredHumidityData = this.humidityData.slice(-range);
        },
        createChart(chartId, type, data, backgroundColor, borderColor) {
            const xAxisLabel = this.selectedTimeRange === '1 Woche' ? 'Datum' : 'Zeit'; // Ändere die X-Achsenbeschriftung
            const yAxisLabel = chartId === 'temperature' ? 'Temperatur (°C)' : 'Luftfeuchtigkeit (%)';
            const ctx = document.getElementById(chartId).getContext('2d');
            const chart = new Chart(ctx, {
                type: type,
                data: {
                    labels: this.filteredLabels, // Dynamische Labels verwenden
                    datasets: [{
                        label: chartId.charAt(0).toUpperCase() + chartId.slice(1),
                        data: data,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    animation: {
                        duration: 0
                    },
                    plugins: {
                        tooltip: {
                            enabled: true
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: xAxisLabel
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: yAxisLabel
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            if (chartId === 'temperature') {
                this.temperatureChart = chart;
            } else {
                this.humidityChart = chart;
            }
        },
        updateChart(chartId) {
            if (chartId === 'temperature') {
                console.log("Updating temperature chart...");
                if (this.temperatureChart) {
                    this.temperatureChart.destroy();
                }
                this.createChart('temperature', this.temperatureChartType, this.filteredTemperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            } else {
                console.log("Updating humidity chart...");
                if (this.humidityChart) {
                    this.humidityChart.destroy();
                }
                this.createChart('humidity', this.humidityChartType, this.filteredHumidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            }
        }
    },
    watch: {
        selectedTimeRange() {
            this.filterData();
            this.updateChart('temperature');
            this.updateChart('humidity');
        }
    }
});

app.mount('#app');