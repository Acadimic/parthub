import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const SubjectGraph = observer(() => {
  const { testPaperStore } = useStores();
  const { exam } = testPaperStore;

  // const COLORS = ['#3699ff', '#f64e76', '#8556e5', '#ffc543', '#49cf95'];

  if (!exam) return null;

  const { subjectGraphData } = exam;
  let height = 50 * subjectGraphData.length;
  height = height > 250 ? height : 250;

  return (
    <div className="w-full">
      <ResponsiveContainer height={height} width="100%">
        <ComposedChart data={subjectGraphData} barSize={24} layout="vertical">
          <CartesianGrid strokeDasharray="2 2" />
          <XAxis allowDecimals={false} type="number" style={{ fontSize: 12, fontWeight: 600 }} />
          <YAxis dataKey="name" style={{ fontSize: 11, fontWeight: 600 }} type="category" />
          <Tooltip itemStyle={{ fontSize: 12, fontWeight: 'bold' }} labelStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar name="Total" dataKey="total" fill="#413ea0">
            <LabelList dataKey="total" style={{ fontSize: 12 }} position="right" />
          </Bar>
          <Scatter name="Correct" dataKey="correct" fill="#40c057" />
          <Scatter name="Incorrect" dataKey="incorrect" fill="#fa5252" />
          <Scatter name="Unattempted" dataKey="unattempted" fill="#ffc543" />
          <Scatter name="Partially Correct" dataKey="partiallyCorrect" fill="#49cf95" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
