import Stack from "../../Wolfie2D/DataTypes/Collections/Stack";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import NavigationPath from "../../Wolfie2D/Pathfinding/NavigationPath";
import NavPathStrat from "../../Wolfie2D/Pathfinding/Strategies/NavigationStrategy";
import PriorityQueue from "../../Wolfie2D/DataTypes/Collections/PriorityQueue";

type AStarNode = {
    index: number,
    parent: AStarNode | null,
    g: number,
    h: number,
    f: number
}

/**
 * The AstarStrategy class is an extension of the abstract NavPathStrategy class. For our navigation system, you can
 * now specify and define your own pathfinding strategy. Originally, the two options were to use Djikstras or a
 * direct (point A -> point B) strategy. The only way to change how the pathfinding was done was by hard-coding things
 * into the classes associated with the navigation system. 
 * 
 */
export default class AstarStrategy extends NavPathStrat {
    /**
     * @see NavPathStrat.buildPath()
     */
    public buildPath(to: Vec2, from: Vec2): NavigationPath {
        let toNode = this.mesh.graph.snap(to);
        let fromNode = this.mesh.graph.snap(from);
        let path = this.AStarAlgorithm(toNode, fromNode);

        let stack = new Stack<Vec2>(this.mesh.graph.numVertices + 1);
        stack.push(to.clone());
        for (let i = path.length - 1; i >= 0; i--) {
            stack.push(this.mesh.graph.getNodePosition(path[i].index).clone());
        }

        return new NavigationPath(stack, 5);
    }

    private AStarAlgorithm(toNode: number, fromNode: number): AStarNode[] {
        const openSet = new PriorityQueue<AStarNode>((a, b) => a.f - b.f, this.mesh.graph.numVertices + 1, true);
        const closedSet = new Set<number>();
        const gScore = new Map<number, number>();

        const targetPos = this.mesh.graph.getNodePosition(toNode).clone();

        gScore.set(fromNode, 0);
        const startNode: AStarNode = {
            index: fromNode,
            parent: null,
            g: 0,
            h: this.heuristic(this.mesh.graph.getNodePosition(fromNode).clone(), targetPos),
            f: 0
        };
        startNode.f = startNode.g + startNode.h;

        openSet.enqueue(startNode);

        while (openSet.hasItems()) {
            const currentNode = openSet.dequeue();

            if (currentNode.index === toNode) {
                return this.reconstructPath(currentNode);
            }

            if (closedSet.has(currentNode.index)) continue;
            closedSet.add(currentNode.index);

            let edges = this.mesh.graph.getEdges(currentNode.index);
            while (edges) {
                const neighborIndex = edges.y;
                const tentativeG = currentNode.g + edges.weight;

                if (gScore.has(neighborIndex) && tentativeG >= gScore.get(neighborIndex)!) {
                    edges = edges.next;
                    continue;
                }

                gScore.set(neighborIndex, tentativeG);
                const neighborNode: AStarNode = {
                    index: neighborIndex,
                    parent: currentNode,
                    g: tentativeG,
                    h: this.heuristic(this.mesh.graph.getNodePosition(neighborIndex).clone(), targetPos),
                    f: 0
                };
                neighborNode.f = neighborNode.g + neighborNode.h;

                openSet.enqueue(neighborNode);
                edges = edges.next;
            }
        }

        return [];
    }

    private heuristic(pos: Vec2, target: Vec2): number {
        return pos.distanceTo(target);
    }

    private reconstructPath(node: AStarNode): AStarNode[] {
        const path: AStarNode[] = [];
        let current: AStarNode | null = node;
        while (current) {
            path.push(current);
            current = current.parent;
        }
        return path.reverse();
    }
}