import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import type { PricePoint } from "@/types/product";

type Props = {
  points: PricePoint[];
};

const CHART_HEIGHT = 190;
const CHART_PADDING = 28;

export function PriceChart({ points }: Props) {
  if (!points.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无服务端历史价格记录</Text>
      </View>
    );
  }

  const width = Math.min(Dimensions.get("window").width - 32, 420);
  const labels = points.map((point) => point.recorded_at.slice(5, 10));
  const data = points.map((point) => Number(point.price));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>价格趋势</Text>
      <Text style={styles.subtitle}>服务端记录价格，不代表全网最低价</Text>
      {Platform.OS === "web" ? (
        <WebLineChart width={width} labels={labels} data={data} />
      ) : (
        <LineChart
          data={{ labels, datasets: [{ data }] }}
          width={width}
          height={CHART_HEIGHT}
          yAxisLabel="¥"
          fromZero={false}
          bezier
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(47, 109, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(102, 112, 133, ${opacity})`,
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#2f6df6" },
          }}
          style={styles.chart}
        />
      )}
    </View>
  );
}

function WebLineChart({ width, labels, data }: { width: number; labels: string[]; data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);
  const chartWidth = width - CHART_PADDING * 2;
  const chartHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const points = data.map((price, index) => {
    const x = CHART_PADDING + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = CHART_PADDING + (1 - (price - min) / range) * chartHeight;
    return { x, y, price, label: labels[index] };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const yTicks = [max, (max + min) / 2, min];

  return (
    <View style={styles.webChart}>
      <Svg width={width} height={CHART_HEIGHT}>
        {yTicks.map((tick, index) => {
          const y = CHART_PADDING + (index / 2) * chartHeight;
          return (
            <Line
              key={`grid-${tick}-${index}`}
              x1={CHART_PADDING}
              y1={y}
              x2={width - CHART_PADDING}
              y2={y}
              stroke="#edf1f8"
              strokeWidth={1}
            />
          );
        })}
        <Path d={path} fill="none" stroke="#2f6df6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <Circle key={`dot-${index}`} cx={point.x} cy={point.y} r={4} fill="#fff" stroke="#2f6df6" strokeWidth={2} />
        ))}
        {points.map((point, index) => (
          <SvgText key={`label-${index}`} x={point.x} y={CHART_HEIGHT - 8} fontSize={10} fill="#667085" textAnchor="middle">
            {point.label}
          </SvgText>
        ))}
        {yTicks.map((tick, index) => (
          <SvgText key={`tick-${index}`} x={6} y={CHART_PADDING + (index / 2) * chartHeight + 4} fontSize={10} fill="#98a2b3">
            {`¥${Math.round(tick)}`}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#edf1f8",
    overflow: "hidden",
  },
  title: {
    paddingHorizontal: 14,
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    paddingHorizontal: 14,
    marginTop: 4,
    color: "#667085",
    fontSize: 12,
  },
  chart: {
    marginTop: 10,
    borderRadius: 12,
  },
  webChart: {
    marginTop: 10,
    alignItems: "center",
  },
  empty: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf1f8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#667085",
    fontSize: 13,
  },
});
