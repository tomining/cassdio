package kr.hakdang.cadio.web.route.cluster;

import com.datastax.oss.driver.api.core.CqlSession;
import jakarta.validation.Valid;
import kr.hakdang.cadio.core.domain.bootstrap.BootstrapProvider;
import kr.hakdang.cadio.core.domain.cluster.TempClusterConnector;
import kr.hakdang.cadio.core.domain.cluster.info.ClusterInfo;
import kr.hakdang.cadio.core.domain.cluster.info.ClusterInfoManager;
import kr.hakdang.cadio.core.domain.cluster.info.ClusterInfoProvider;
import kr.hakdang.cadio.core.domain.cluster.info.ClusterInfoRegisterArgs;
import kr.hakdang.cadio.web.common.dto.response.ApiResponse;
import kr.hakdang.cadio.web.route.BaseSample;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static java.util.Collections.emptyMap;

/**
 * ClusterApi
 *
 * @author akageun
 * @since 2024-06-30
 */
@Slf4j
@RestController
@RequestMapping("/api/cassandra/cluster")
public class ClusterApi extends BaseSample {

    private final BootstrapProvider bootstrapProvider;
    private final ClusterInfoProvider clusterInfoProvider;

    private final ClusterInfoManager clusterInfoManager;

    private final TempClusterConnector tempClusterConnector;

    public ClusterApi(
        BootstrapProvider bootstrapProvider,
        ClusterInfoProvider clusterInfoProvider,
        ClusterInfoManager clusterInfoManager,
        TempClusterConnector tempClusterConnector
    ) {
        this.bootstrapProvider = bootstrapProvider;
        this.clusterInfoProvider = clusterInfoProvider;
        this.clusterInfoManager = clusterInfoManager;
        this.tempClusterConnector = tempClusterConnector;
    }

    @GetMapping("")
    public ApiResponse<Map<String, Object>> getCassandraClusterList(
        @RequestParam(required = false, defaultValue = "false") boolean withPassword
    ) {
        Map<String, Object> result = new HashMap<>();
        List<ClusterInfo> clusters = clusterInfoProvider.getList();
        if (!withPassword) {
            clusters = clusters.stream()
                .map(info -> info.toBuilder().password(null).build())
                .toList();
        }

        result.put("clusters", clusters);

        return ApiResponse.ok(result);
    }

    @GetMapping("/{clusterId}")
    public ApiResponse<Map<String, Object>> getCassandraClusterDetail(
        @PathVariable String clusterId
    ) {
        Map<String, Object> result = new HashMap<>();
        try (CqlSession session = makeSession()) { //TODO : interface 작업할 때 facade layer 로 변경 예정
            //session.getMetadata().getNodes()
        } catch (Exception e) {
            log.error("error : {}", e.getMessage(), e);
            throw e;
        }
        return ApiResponse.ok(emptyMap());
    }

    @PostMapping("")
    public ApiResponse<Map<String, Object>> clusterRegister(
        @Valid @RequestBody ClusterRegisterRequest request
    ) {
        try (
            CqlSession session = tempClusterConnector.makeSession(request.makeClusterConnector());
        ) {
            String clusterName = session.getMetadata().getClusterName()
                .orElse(UUID.randomUUID().toString());

            ClusterInfoRegisterArgs args = request.makeArgs(clusterName);
            //실행 안되면 exception

            clusterInfoManager.register(args);

            bootstrapProvider.updateMinClusterCountCheck(clusterInfoProvider.checkMinClusterCount());
        }

        return ApiResponse.ok(emptyMap());
    }

}
