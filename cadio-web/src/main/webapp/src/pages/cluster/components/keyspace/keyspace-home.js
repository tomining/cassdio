import {Link, useParams} from "react-router-dom";
import {useClusterState} from "../../context/clusterContext";
import {useEffect, useState} from "react";
import axios from "axios";
import Spinner from "../../../../components/spinner";
import KeyspaceTableList from "./keyspace-table-list";
import {axiosCatch} from "../../../../utils/axiosUtils";

const KeyspaceHome = () => {

    const routeParams = useParams();

    //const {doGetKeyspaceList} = useCluster();
    const {
        keyspaceList,
        keyspaceListLoading,
    } = useClusterState();

    const [detailLoading, setDetailLoading] = useState(false);
    const [keyspaceDetail, setKeyspaceDetail] = useState({
        keyspace_name: '',
        name: '',
        create_statement: '',
    });
    const [tableLoading, setTableLoading] = useState(false);
    const [tableCursor, setTableCursor] = useState(null)
    const [tableList, setTableList] = useState([]);

    useEffect(() => {
        //show component
        setKeyspaceDetail({});
        setDetailLoading(true)
        setTableList([]);
        axios({
            method: "GET",
            url: `/api/cassandra/cluster/${routeParams.clusterId}/keyspace/${routeParams.keyspaceName}`,
            params: {
                withTableList : true,
            }
        }).then((response) => {
            console.log("res ", response);
            setKeyspaceDetail(response.data.result.describe)

            setTableList(response.data.result.tableList.rows)
            if (response.data.result.tableList.nextCursor) {
                setTableCursor(response.data.result.tableList.nextCursor)
            }

        }).catch((error) => {
            axiosCatch(error)
        }).finally(() => {
            setDetailLoading(false)
        });
        //
        // axios({
        //     method: "GET",
        //     url: `/api/cassandra/cluster/${routeParams.clusterId}/keyspace/${routeParams.keyspaceName}/table`,
        //     params: {
        //         size: 50,
        //         cursor: tableCursor // TODO: 스크롤 페이지네이션 처리
        //     }
        // }).then((response) => {
        //     console.log("KeyspaceHome ", response);
        //     setTableList(response.data.result.items)
        //     if (response.data.result.cursor.hasNext) {
        //         setTableCursor(response.data.result.cursor.next)
        //     }
        // }).catch((error) => {
        //     axiosCatch(error)
        // }).finally(() => {
        //     setTableLoading(false)
        // });

        return () => {
            //hide component

        };
    }, [routeParams.clusterId, routeParams.keyspaceName]);

    return (
        <>
            <div className={"row pt-3"}>
                <nav className={"breadcrumb-arrow"} aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link to={`/cluster/${routeParams.clusterId}`}
                                  className={"link-body-emphasis text-decoration-none"}>
                                Cluster
                            </Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            {routeParams.keyspaceName}
                        </li>
                    </ol>
                </nav>
            </div>

            <div
                className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h2 className="h2">
                    Keyspace <code>{keyspaceDetail.keyspace_name}</code>
                </h2>
                {/*<div className="btn-toolbar mb-2 mb-md-0">*/}
                {/*    <div className="btn-group me-2">*/}
                {/*        <button type="button" className="btn btn-sm btn-outline-secondary">Share</button>*/}
                {/*        <button type="button" className="btn btn-sm btn-outline-secondary">Export</button>*/}
                {/*    </div>*/}
                {/*    <button type="button"*/}
                {/*            className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1">*/}
                {/*        This week*/}
                {/*    </button>*/}
                {/*</div>*/}
            </div>

            <Spinner loading={detailLoading}>
                <code style={{whiteSpace: "pre"}}>
                    {keyspaceDetail.create_statement}
                </code>

                <div className={"row mt-3"}>
                    <div className={"col-md-6 col-sm-12"}>
                        <h2 className="h3">Tables</h2>

                        <KeyspaceTableList clusterId={routeParams.clusterId} keyspaceName={routeParams.keyspaceName}
                                           tableList={tableList}/>

                    </div>
                    <div className={"col-md-6 col-sm-12"}>
                        <h2 className="h3">Views</h2>


                    </div>
                </div>
            </Spinner>
        </>
    )
}

export default KeyspaceHome;
