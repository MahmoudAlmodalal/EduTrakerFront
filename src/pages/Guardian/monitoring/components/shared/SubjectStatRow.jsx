import React from 'react';
import TrendBadge from './TrendBadge';
import { formatPercentage } from '../../utils/monitoringUtils';

const SubjectStatRow = ({ stat }) => {
    return (
        <tr>
            <td>{stat.subject}</td>
            <td>{formatPercentage(stat.average)}</td>
            <td>{formatPercentage(stat.best)}</td>
            <td>{formatPercentage(stat.last)}</td>
            <td>{stat.totalAssessments}</td>
            <td>
                <TrendBadge trend={stat.trend} />
            </td>
        </tr>
    );
};

export default SubjectStatRow;
