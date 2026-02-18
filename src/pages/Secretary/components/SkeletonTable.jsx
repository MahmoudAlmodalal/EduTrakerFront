import React from 'react';

const shimmerKeyframes = `
@keyframes secSkeletonShimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
}
`;

const SkeletonTable = ({ rows = 5, cols = 5 }) => {
    return (
        <div className="sec-table-scroll">
            <style>{shimmerKeyframes}</style>
            <table className="data-table sec-data-table">
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                            {Array.from({ length: cols }).map((__, colIndex) => (
                                <td key={`cell-${rowIndex}-${colIndex}`}>
                                    <div
                                        style={{
                                            height: 16,
                                            borderRadius: 6,
                                            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
                                            backgroundSize: '1000px 100%',
                                            animation: 'secSkeletonShimmer 1.5s infinite linear',
                                        }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SkeletonTable;
