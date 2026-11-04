"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cedi } from "@/lib/format";

export default function DailyChart({ data, today }: { data: { day: number; amount: number }[]; today: number | null }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#85706f" }}
            ticks={[1, 8, 15, 22, data.length]}
          />
          <Tooltip
            cursor={{ fill: "rgba(63,41,43,0.05)", radius: 6 }}
            formatter={(v) => [cedi(Number(v)), "Spent"]}
            labelFormatter={(d) => `Day ${d}`}
            contentStyle={{ borderRadius: 14, border: "1px solid #f1e6da", fontSize: 13, color: "#3f292b" }}
          />
          <Bar
            dataKey="amount"
            radius={[5, 5, 5, 5]}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; payload: { day: number } };
              const h = Math.max(p.height, 3);
              return (
                <rect
                  x={p.x}
                  y={p.y + p.height - h}
                  width={p.width}
                  height={h}
                  rx={Math.min(5, p.width / 2)}
                  fill={p.payload.day === today ? "#3f292b" : p.height > 0 ? "#ef4444" : "#f1e6da"}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
