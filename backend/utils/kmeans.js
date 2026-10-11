function kmeans(data, k, maxIterations = 100) {
    if (k < 2 || k > data.length) {
        console.error(` Invalid k value (${k}) detected! k must be between 2 and ${data.length}. Setting k = 2.`);
        k = 2;
    }

    // Randomly initialize centroids
    const initializeCentroids = (data, k) => {
        const shuffled = data.slice().sort(() => 0.5 - Math.random());
        return shuffled.slice(0, k);
    };

    let centroids = initializeCentroids(data, k);
    let prevCentroids, clusters;
    let iteration = 0;
    let distortion = 0;

    do {
        // Assign each point to the nearest centroid
        clusters = data.map(point => {
            const distances = centroids.map(centroid => 
                Math.sqrt(centroid.reduce((sum, val, i) => sum + (val - point[i]) ** 2, 0))
            );
            return distances.indexOf(Math.min(...distances));
        });

        // Save previous centroids for convergence check
        prevCentroids = [...centroids];

        // Calculate new centroids
        centroids = Array.from({ length: k }, (_, i) => {
            const clusterPoints = data.filter((_, j) => clusters[j] === i);
            if (clusterPoints.length === 0) {
                // If a cluster is empty, reassign the centroid to a random point
                return data[Math.floor(Math.random() * data.length)];
            }
            return clusterPoints[0].map((_, dim) => 
                clusterPoints.reduce((sum, point) => sum + point[dim], 0) / clusterPoints.length
            );
        });

        // Calculate distortion (sum of squared distances)
        distortion = data.reduce((sum, point, i) => {
            const centroid = centroids[clusters[i]];
            return sum + centroid.reduce((s, val, j) => s + (val - point[j]) ** 2, 0);
        }, 0);

        iteration++;
    } while (!centroids.every((centroid, i) => 
        centroid.every((val, j) => val === prevCentroids[i][j])
    ) && iteration < maxIterations);

    // Calculate Silhouette Score
    const calculateSilhouetteScore = (data, clusters, centroids) => {
        const numPoints = data.length;
        const silhouetteScores = [];

        for (let i = 0; i < numPoints; i++) {
            const point = data[i];
            const cluster = clusters[i];

            // Calculate a(i): Average distance to points in the same cluster
            const sameClusterPoints = data.filter((_, j) => clusters[j] === cluster);
            const a = sameClusterPoints.reduce((sum, p) => {
                return sum + Math.sqrt(p.reduce((s, val, idx) => s + (val - point[idx]) ** 2, 0));
            }, 0) / (sameClusterPoints.length || 1); // Avoid division by zero

            // Calculate b(i): Average distance to points in the nearest cluster
            let b = Infinity;
            centroids.forEach((centroid, clusterIdx) => {
                if (clusterIdx !== cluster) {
                    const otherClusterPoints = data.filter((_, j) => clusters[j] === clusterIdx);
                    const avgDistance = otherClusterPoints.reduce((sum, p) => {
                        return sum + Math.sqrt(p.reduce((s, val, idx) => s + (val - point[idx]) ** 2, 0));
                    }, 0) / (otherClusterPoints.length || 1); // Avoid division by zero

                    if (avgDistance < b) {
                        b = avgDistance;
                    }
                }
            });

            // Calculate Silhouette Score for the point
            const s = (b - a) / Math.max(a, b);
            silhouetteScores.push(s);
        }

        // Return the average Silhouette Score
        return silhouetteScores.reduce((sum, s) => sum + s, 0) / numPoints;
    };

    const silhouetteScore = calculateSilhouetteScore(data, clusters, centroids);

    console.log(` Final Clusters:`, clusters);
    console.log(` Silhouette Score: ${silhouetteScore.toFixed(4)}`);
    return { clusters, centroids, distortion, silhouetteScore };
}

module.exports = kmeans;