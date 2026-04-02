import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Lấy các tham số từ URL
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category"); // 'image', 'video', 'audio'
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at"; // 'price', 'created_at'
    const order = searchParams.get("order") || "desc";

    // 2. Tính toán phạm vi phân trang
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. Xây dựng truy vấn Supabase
    let query = supabase
      .from("nfts")
      .select("*", { count: "exact" });

    // Bộ lọc theo loại file
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Bộ lọc tìm kiếm theo tên (không phân biệt hoa thường)
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Sắp xếp và Phân trang
    query = query
      .order(sortBy, { ascending: order === "asc" })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      metadata: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}