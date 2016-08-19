import { navigate, views } from './constants';
import VIEWS from '../Views';
import dates from './dates';

export default function getViewRange(date, view, culture){
  switch (view){
    case views.MONTH:
    case views.WEEK:
          return VIEWS[view].range(date, culture)
    case views.DAY: {
          const start = dates.startOf(date, 'day')
          const end = dates.endOf(date, 'day')
          return { start: date, end: date }
    }
    case views.AGENDA:
          return VIEWS[view].range(date)
    default:
      return {start: date, end: date}
  }
}